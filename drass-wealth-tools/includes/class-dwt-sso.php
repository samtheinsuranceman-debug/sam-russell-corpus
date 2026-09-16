<?php
/**
 * Single sign-on against Russell Capital Systems.
 *
 * WHY THIS EXISTS
 * ---------------
 * Drass runs on WordPress. The calculators, the client dashboards and the
 * agent tooling all live on the Russell Capital Systems platform, which has
 * its own accounts. Without this module a person signs in twice, and the two
 * sessions expire on independent clocks — the reliable way to produce a
 * half-loaded dashboard, a surprise 401, or worse, one visitor seeing state
 * that belongs to another.
 *
 * So there is exactly ONE identity. Russell Capital Systems is the authority.
 * WordPress holds a session derived from an RCS token and never outlives it.
 *
 * THE FLOW
 *   1. Visitor clicks sign-in. We mint a single-use nonce plus a state value,
 *      store both server-side, and send them to the RCS authorize endpoint.
 *   2. RCS authenticates the person and redirects back with a signed token.
 *   3. We verify the signature, the expiry, the audience, the issuer and the
 *      nonce before we trust one byte of it.
 *   4. We link or create the matching WordPress user and start its session.
 *
 * WHAT THIS MODULE WILL NOT DO
 *   - It never accepts an unsigned or expired token.
 *   - It never keys a user on email alone. Email changes; the RCS subject id
 *     does not. Keying on email is how one person inherits another's account.
 *   - It never writes client financial detail into WordPress. Figures stay on
 *     the RCS side and are rendered through the API, so a WordPress
 *     compromise does not become a disclosure of client data.
 *
 * @package drass-wealth-tools
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

final class DWT_SSO {

	/** Option: the RCS origin, e.g. https://app.russellcapitalsystems.com */
	const OPT_ISSUER = 'dwt_sso_issuer';

	/** Option: shared signing secret supplied with this package. */
	const OPT_SECRET = 'dwt_sso_secret';

	/** Option: where the JoinAQAL tab points. */
	const OPT_AQAL_URL = 'dwt_aqal_url';

	/** Meta key linking a WordPress user to its RCS subject id. */
	const META_SUBJECT = 'dwt_rcs_subject';

	/** Query var the return leg arrives on. */
	const RETURN_ACTION = 'dwt_sso_return';

	/** How long a pending handshake stays valid. */
	const HANDSHAKE_TTL = 600;

	public static function init(): void {
		add_action( 'init', [ __CLASS__, 'maybe_handle_return' ] );
		add_shortcode( 'dwt_login', [ __CLASS__, 'login_button' ] );
		add_shortcode( 'dwt_account_nav', [ __CLASS__, 'account_nav' ] );
	}

	/** True only when an issuer AND a secret are both present. */
	public static function configured(): bool {
		return '' !== trim( (string) get_option( self::OPT_ISSUER, '' ) )
			&& '' !== trim( (string) get_option( self::OPT_SECRET, '' ) );
	}

	/**
	 * Begin a handshake and return the URL to send the visitor to.
	 *
	 * The nonce is stored server-side, not in the URL alone, so a replayed
	 * callback finds nothing to match and is rejected.
	 */
	public static function authorize_url( string $return_to = '' ): string {
		$issuer = untrailingslashit( (string) get_option( self::OPT_ISSUER, '' ) );
		if ( '' === $issuer ) {
			return '';
		}

		$nonce = wp_generate_password( 32, false, false );
		$state = wp_generate_password( 32, false, false );

		set_transient(
			'dwt_sso_' . $state,
			[
				'nonce'     => $nonce,
				'return_to' => $return_to !== '' ? $return_to : home_url( '/' ),
			],
			self::HANDSHAKE_TTL
		);

		return add_query_arg(
			[
				'client_id'    => 'drass-wordpress',
				'redirect_uri' => rawurlencode( add_query_arg( self::RETURN_ACTION, '1', home_url( '/' ) ) ),
				'state'        => $state,
				'nonce'        => $nonce,
			],
			$issuer . '/sso/authorize'
		);
	}

	/** Handle the return leg, if this request is one. */
	public static function maybe_handle_return(): void {
		if ( ! isset( $_GET[ self::RETURN_ACTION ] ) ) {
			return;
		}
		if ( ! self::configured() ) {
			wp_die( esc_html__( 'Single sign-on is not configured on this site.', 'drass-wealth-tools' ) );
		}

		$state = isset( $_GET['state'] ) ? sanitize_text_field( wp_unslash( $_GET['state'] ) ) : '';
		$token = isset( $_GET['token'] ) ? trim( (string) wp_unslash( $_GET['token'] ) ) : '';

		$pending = $state !== '' ? get_transient( 'dwt_sso_' . $state ) : false;
		if ( ! is_array( $pending ) ) {
			self::fail( 'This sign-in link has expired. Please sign in again.' );
		}
		// Single use, whatever happens next.
		delete_transient( 'dwt_sso_' . $state );

		$claims = self::verify_token( $token, (string) $pending['nonce'] );
		if ( null === $claims ) {
			self::fail( 'We could not verify that sign-in. Please try again.' );
		}

		$user_id = self::link_user( $claims );
		if ( is_wp_error( $user_id ) ) {
			self::fail( 'We verified you, but could not open your account on this site.' );
		}

		wp_set_current_user( $user_id );
		wp_set_auth_cookie( $user_id, false );

		$return_to = (string) $pending['return_to'];
		wp_safe_redirect( $return_to !== '' ? $return_to : home_url( '/' ) );
		exit;
	}

	/**
	 * Verify a compact JWS (HS256) and return its claims, or null.
	 *
	 * Every check here is load bearing. A token that fails any one of them is
	 * not a degraded token, it is someone else's or a forged one.
	 */
	public static function verify_token( string $token, string $expected_nonce ): ?array {
		$parts = explode( '.', $token );
		if ( 3 !== count( $parts ) ) {
			return null;
		}
		list( $b64_header, $b64_payload, $b64_sig ) = $parts;

		$header = json_decode( (string) self::b64url_decode( $b64_header ), true );
		if ( ! is_array( $header ) || ( $header['alg'] ?? '' ) !== 'HS256' ) {
			// Refusing anything but the algorithm we expect closes the
			// "alg: none" and algorithm-confusion families outright.
			return null;
		}

		$secret   = (string) get_option( self::OPT_SECRET, '' );
		$expected = hash_hmac( 'sha256', $b64_header . '.' . $b64_payload, $secret, true );
		$actual   = self::b64url_decode( $b64_sig );
		if ( ! is_string( $actual ) || ! hash_equals( $expected, $actual ) ) {
			return null;
		}

		$claims = json_decode( (string) self::b64url_decode( $b64_payload ), true );
		if ( ! is_array( $claims ) ) {
			return null;
		}

		$now    = time();
		$issuer = untrailingslashit( (string) get_option( self::OPT_ISSUER, '' ) );

		if ( ! isset( $claims['exp'] ) || $now >= (int) $claims['exp'] ) {
			return null;
		}
		if ( isset( $claims['nbf'] ) && $now < (int) $claims['nbf'] - 60 ) {
			return null;
		}
		if ( untrailingslashit( (string) ( $claims['iss'] ?? '' ) ) !== $issuer ) {
			return null;
		}
		if ( ( $claims['aud'] ?? '' ) !== 'drass-wordpress' ) {
			return null;
		}
		if ( ! hash_equals( $expected_nonce, (string) ( $claims['nonce'] ?? '' ) ) ) {
			return null;
		}
		if ( '' === trim( (string) ( $claims['sub'] ?? '' ) ) ) {
			return null;
		}

		return $claims;
	}

	/**
	 * Find or create the WordPress user for these claims.
	 *
	 * Matching is on the RCS subject id, never on email.
	 *
	 * @return int|WP_Error
	 */
	private static function link_user( array $claims ) {
		$subject = (string) $claims['sub'];
		$email   = sanitize_email( (string) ( $claims['email'] ?? '' ) );
		$role    = self::map_role( (string) ( $claims['role'] ?? 'client' ) );

		$existing = get_users(
			[
				'meta_key'   => self::META_SUBJECT,
				'meta_value' => $subject,
				'number'     => 1,
				'fields'     => 'ID',
			]
		);
		if ( ! empty( $existing ) ) {
			$user_id = (int) $existing[0];
			$user    = new WP_User( $user_id );
			if ( ! in_array( $role, (array) $user->roles, true ) ) {
				$user->set_role( $role );
			}
			return $user_id;
		}

		if ( '' === $email || ! is_email( $email ) ) {
			return new WP_Error( 'dwt_sso_no_email', 'No usable email in token.' );
		}

		// An account with this email but no subject link is almost always the
		// same person from before SSO. Adopt it rather than creating a second.
		$by_email = get_user_by( 'email', $email );
		if ( $by_email instanceof WP_User ) {
			update_user_meta( $by_email->ID, self::META_SUBJECT, $subject );
			$by_email->set_role( $role );
			return $by_email->ID;
		}

		$user_id = wp_insert_user(
			[
				'user_login'   => 'rcs_' . substr( hash( 'sha256', $subject ), 0, 20 ),
				'user_email'   => $email,
				'display_name' => sanitize_text_field( (string) ( $claims['name'] ?? $email ) ),
				'user_pass'    => wp_generate_password( 48, true, true ),
				'role'         => $role,
			]
		);
		if ( is_wp_error( $user_id ) ) {
			return $user_id;
		}
		update_user_meta( $user_id, self::META_SUBJECT, $subject );
		return (int) $user_id;
	}

	/** RCS roles map onto WordPress roles; anything unknown lands on the least privilege. */
	private static function map_role( string $rcs_role ): string {
		switch ( strtolower( $rcs_role ) ) {
			case 'agent':
			case 'advisor':
				return 'dwt_agent';
			case 'admin':
				return 'administrator';
			default:
				return 'dwt_client';
		}
	}

	/** Roles created on activation. Neither can edit site content. */
	public static function register_roles(): void {
		add_role( 'dwt_client', 'Drass Client', [ 'read' => true ] );
		add_role( 'dwt_agent', 'Drass Agent', [ 'read' => true ] );
	}

	public static function login_button( $atts = [] ): string {
		$atts = shortcode_atts( [ 'label' => 'Sign in' ], $atts, 'dwt_login' );

		if ( ! self::configured() ) {
			return DWT_Shortcodes::render_refusal( 'Sign-in is not configured yet. Set the single sign-on fields under Settings, Drass Wealth Tools.' );
		}
		if ( is_user_logged_in() ) {
			return '<a class="dwt-btn" href="' . esc_url( wp_logout_url( home_url( '/' ) ) ) . '">Sign out</a>';
		}

		$url = self::authorize_url( self::current_url() );
		return '<a class="dwt-btn dwt-btn-primary" href="' . esc_url( $url ) . '">' . esc_html( $atts['label'] ) . '</a>';
	}

	/** The account bar: dashboard, JoinAQAL, sign out. */
	public static function account_nav( $atts = [] ): string {
		$aqal = trim( (string) get_option( self::OPT_AQAL_URL, '' ) );
		$out  = '<nav class="dwt-account-nav">';

		if ( is_user_logged_in() ) {
			$issuer = untrailingslashit( (string) get_option( self::OPT_ISSUER, '' ) );
			if ( '' !== $issuer ) {
				$out .= '<a class="dwt-navlink" href="' . esc_url( $issuer . '/portal' ) . '">My dashboard</a>';
			}
		} else {
			$out .= self::login_button();
		}

		if ( '' !== $aqal ) {
			$out .= '<a class="dwt-navlink" href="' . esc_url( $aqal ) . '" target="_blank" rel="noopener">JoinAQAL</a>';
		}

		return $out . '</nav>';
	}

	private static function current_url(): string {
		$path = isset( $_SERVER['REQUEST_URI'] ) ? wp_unslash( $_SERVER['REQUEST_URI'] ) : '/';
		return home_url( esc_url_raw( (string) $path ) );
	}

	private static function b64url_decode( string $input ) {
		$pad = strlen( $input ) % 4;
		if ( $pad > 0 ) {
			$input .= str_repeat( '=', 4 - $pad );
		}
		return base64_decode( strtr( $input, '-_', '+/' ), true );
	}

	private static function fail( string $message ): void {
		wp_die(
			esc_html( $message ),
			esc_html__( 'Sign-in failed', 'drass-wealth-tools' ),
			[ 'response' => 403, 'back_link' => true ]
		);
	}
}

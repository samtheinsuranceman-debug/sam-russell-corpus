<?php
/**
 * Client for the Russell Capital Systems engine API.
 *
 * The engines live on the RCS platform, not in WordPress. This plugin is a
 * renderer. That split is deliberate: the arithmetic behind a Roth conversion
 * or an index backtest should exist once and be corrected once, not forked
 * into a PHP copy that drifts from the original within a quarter.
 *
 * Nothing here writes. Every call is a GET or an idempotent POST of the
 * visitor's own inputs, and no credential ever reaches the browser — requests
 * originate from the WordPress server, which is why the API key is stored in
 * options rather than printed into a script tag.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DWT_API {

	const OPT_BASE  = 'dwt_api_base';
	const OPT_KEY   = 'dwt_api_key';
	const TIMEOUT   = 12;
	const CACHE_TTL = 300;

	public static function base_url(): string {
		return untrailingslashit( (string) get_option( self::OPT_BASE, '' ) );
	}

	public static function is_configured(): bool {
		return '' !== self::base_url();
	}

	/**
	 * Call an engine endpoint.
	 *
	 * Returns the decoded body, or a WP_Error that says which of the failure
	 * modes happened. It never returns a plausible-looking default on failure.
	 * A calculator that quietly substitutes a made-up number for a real one is
	 * worse than one that says it is unavailable, because nobody re-checks a
	 * figure that looks right.
	 *
	 * @return array|WP_Error
	 */
	public static function get( string $path, array $params = [] ) {
		if ( ! self::is_configured() ) {
			return new WP_Error(
				'dwt_not_configured',
				'This tool is not yet connected. A site administrator needs to set the API base URL under Settings > Drass Wealth Tools.'
			);
		}

		$url = self::base_url() . '/' . ltrim( $path, '/' );
		if ( $params ) {
			$url = add_query_arg( array_map( 'rawurlencode', $params ), $url );
		}

		$cache_key = 'dwt_' . md5( $url );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$headers = [ 'Accept' => 'application/json' ];
		$key     = (string) get_option( self::OPT_KEY, '' );
		if ( '' !== $key ) {
			$headers['Authorization'] = 'Bearer ' . $key;
		}

		$res = wp_remote_get( $url, [
			'timeout'     => self::TIMEOUT,
			'headers'     => $headers,
			'user-agent'  => 'DrassWealthTools/' . DWT_VERSION . '; ' . home_url(),
			'redirection' => 2,
		] );

		if ( is_wp_error( $res ) ) {
			return new WP_Error(
				'dwt_unreachable',
				'The calculation service did not respond. Please try again shortly.'
			);
		}

		$code = (int) wp_remote_retrieve_response_code( $res );
		$body = wp_remote_retrieve_body( $res );

		if ( 401 === $code || 403 === $code ) {
			return new WP_Error( 'dwt_unauthorized', 'The calculation service rejected this site\'s credentials.' );
		}
		if ( 429 === $code ) {
			return new WP_Error( 'dwt_rate_limited', 'The calculation service is rate limited right now. Please try again in a moment.' );
		}
		if ( $code >= 400 ) {
			return new WP_Error( 'dwt_http_error', sprintf( 'The calculation service returned %d.', $code ) );
		}

		$data = json_decode( $body, true );
		if ( null === $data && JSON_ERROR_NONE !== json_last_error() ) {
			return new WP_Error( 'dwt_bad_payload', 'The calculation service returned a response this page could not read.' );
		}

		set_transient( $cache_key, $data, self::CACHE_TTL );
		return $data;
	}
}

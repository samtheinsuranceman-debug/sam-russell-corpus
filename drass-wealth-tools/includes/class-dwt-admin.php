<?php
/**
 * Settings screen. One page, three fields, no dashboard clutter.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DWT_Admin {

	public static function init(): void {
		add_action( 'admin_menu', [ __CLASS__, 'menu' ] );
		add_action( 'admin_init', [ __CLASS__, 'settings' ] );
	}

	public static function menu(): void {
		add_options_page(
			'Drass Wealth Tools',
			'Drass Wealth Tools',
			'manage_options',
			'drass-wealth-tools',
			[ __CLASS__, 'render' ]
		);
	}

	public static function settings(): void {
		register_setting( 'dwt', DWT_API::OPT_BASE, [
			'type'              => 'string',
			'sanitize_callback' => 'esc_url_raw',
			'default'           => '',
		] );
		// Single sign-on. Until both of these are set the sign-in button says
		// so rather than sending anyone to a broken handshake.
		register_setting( 'dwt', DWT_SSO::OPT_ISSUER, [
			'type'              => 'string',
			'sanitize_callback' => 'esc_url_raw',
			'default'           => '',
		] );
		register_setting( 'dwt', DWT_SSO::OPT_SECRET, [
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
		] );
		register_setting( 'dwt', DWT_SSO::OPT_AQAL_URL, [
			'type'              => 'string',
			'sanitize_callback' => 'esc_url_raw',
			'default'           => '',
		] );
		register_setting( 'dwt', DWT_API::OPT_KEY, [
			'type'              => 'string',
			'sanitize_callback' => 'sanitize_text_field',
			'default'           => '',
		] );
	}

	public static function render(): void {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		$configured = DWT_API::is_configured();
		?>
		<div class="wrap">
			<h1>Drass Wealth Tools</h1>

			<?php if ( ! $configured ) : ?>
				<div class="notice notice-warning"><p>
					<strong>Not connected yet.</strong> Paste the API base URL supplied with this
					plugin below. Until then every tool on the site shows a short "not yet
					available" note instead of a broken calculator.
				</p></div>
			<?php else : ?>
				<div class="notice notice-success"><p><strong>Connected.</strong> Tools are live.</p></div>
			<?php endif; ?>

			<form method="post" action="options.php">
				<?php settings_fields( 'dwt' ); ?>
				<table class="form-table" role="presentation">
					<tr>
						<th scope="row"><label for="dwt_base">API base URL</label></th>
						<td>
							<input name="<?php echo esc_attr( DWT_API::OPT_BASE ); ?>" id="dwt_base"
								type="url" class="regular-text" placeholder="https://…"
								value="<?php echo esc_attr( get_option( DWT_API::OPT_BASE, '' ) ); ?>">
							<p class="description">Supplied with this package. Must be https.</p>
						</td>
					</tr>
					<tr>
						<th scope="row"><label for="dwt_key">API key</label></th>
						<td>
							<input name="<?php echo esc_attr( DWT_API::OPT_KEY ); ?>" id="dwt_key"
								type="password" class="regular-text" autocomplete="off"
								value="<?php echo esc_attr( get_option( DWT_API::OPT_KEY, '' ) ); ?>">
							<p class="description">
								Stored server-side and sent only from this server. It is never
								written into a page and never reaches a visitor's browser.
							</p>
						</td>
					</tr>
						<tr>
							<th scope="row"><label for="dwt_sso_issuer">Sign-on origin</label></th>
							<td><input type="url" class="regular-text" id="dwt_sso_issuer"
								name="<?php echo esc_attr( DWT_SSO::OPT_ISSUER ); ?>"
								value="<?php echo esc_attr( get_option( DWT_SSO::OPT_ISSUER, '' ) ); ?>">
								<p class="description">The Russell Capital Systems origin, with no trailing slash.</p></td>
						</tr>
						<tr>
							<th scope="row"><label for="dwt_sso_secret">Sign-on secret</label></th>
							<td><input type="password" class="regular-text" id="dwt_sso_secret" autocomplete="off"
								name="<?php echo esc_attr( DWT_SSO::OPT_SECRET ); ?>"
								value="<?php echo esc_attr( get_option( DWT_SSO::OPT_SECRET, '' ) ); ?>">
								<p class="description">Supplied with this package. Treat it like a password; anyone holding it can mint a sign-in.</p></td>
						</tr>
						<tr>
							<th scope="row"><label for="dwt_aqal_url">JoinAQAL link</label></th>
							<td><input type="url" class="regular-text" id="dwt_aqal_url"
								name="<?php echo esc_attr( DWT_SSO::OPT_AQAL_URL ); ?>"
								value="<?php echo esc_attr( get_option( DWT_SSO::OPT_AQAL_URL, '' ) ); ?>">
								<p class="description">Shown as a tab in the <code>[dwt_account_nav]</code> bar. Leave blank to hide it.</p></td>
						</tr>
				</table>
				<?php submit_button(); ?>
			</form>

			<h2>Placing a tool on a page</h2>
			<p>Paste a shortcode into any page or post:</p>
			<table class="widefat striped" style="max-width:820px">
				<thead><tr><th>Shortcode</th><th>What it renders</th></tr></thead>
				<tbody>
				<?php foreach ( DWT_Shortcodes::catalog() as $tag => $info ) : ?>
					<tr>
						<td><code>[<?php echo esc_html( $tag ); ?>]</code></td>
						<td><?php echo esc_html( $info['label'] ); ?></td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
		</div>
		<?php
	}
}

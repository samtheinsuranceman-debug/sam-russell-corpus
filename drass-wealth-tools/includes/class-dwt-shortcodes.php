<?php
/**
 * Shortcode registry.
 *
 * Every tool is a shortcode so the Drass administrators can place them on any
 * page without touching a template, and remove them by deleting one line.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DWT_Shortcodes {

	public static function catalog(): array {
		return [
			'dwt_index_history' => [
				'label' => 'Index history — what floors and caps would have done over 30 years (educational)',
				'file'  => 'backtester.php',
				'fn'    => 'dwt_render_backtester',
			],
			'dwt_catalog' => [
				'label' => 'Engine catalogue — the planning engines this site can present, pulled live',
				'file'  => 'catalog.php',
				'fn'    => 'dwt_render_catalog',
			],
			'dwt_time_machine' => [
				'label' => 'Time Machine — the AG 49 illustration beside its required historical disclosure',
				'file'  => 'time-machine.php',
				'fn'    => 'dwt_render_time_machine',
			],
		];
	}

	public static function init(): void {
		foreach ( self::catalog() as $tag => $info ) {
			$path = DWT_DIR . 'calculators/' . $info['file'];
			if ( file_exists( $path ) ) {
				require_once $path;
			}
			if ( function_exists( $info['fn'] ) ) {
				add_shortcode( $tag, $info['fn'] );
			}
		}
	}

	/**
	 * Render a refusal in place of a tool.
	 *
	 * Used both when the plugin is unconfigured and when the compliance guard
	 * blocks a view. In either case the visitor gets a plain sentence, not a
	 * half-drawn table and not a silent blank.
	 */
	public static function render_refusal( $err ): string {
		$msg = is_wp_error( $err ) ? $err->get_error_message() : (string) $err;
		wp_enqueue_style( 'dwt' );
		return '<div class="dwt-refusal" role="note"><p>' . esc_html( $msg ) . '</p></div>';
	}
}

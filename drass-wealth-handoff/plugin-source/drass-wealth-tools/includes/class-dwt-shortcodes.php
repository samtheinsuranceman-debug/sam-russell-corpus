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
			'dwt_index_segments' => [
				'label' => 'Index segments — a multi-year segment credit beside what it is per year (educational)',
				'file'  => 'segments.php',
				'fn'    => 'dwt_render_segments',
				'page'  => 'What Did A Two-Year Segment Actually Credit?',
			],
			'dwt_concierge' => [
				'label' => 'Concierge — ask by voice or text; speech stays in the visitor\'s browser',
				'file'  => 'concierge.php',
				'fn'    => 'dwt_render_concierge',
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
			'dwt_monte_carlo' => [
				'label' => 'Will the money last? — ten thousand modelled retirements',
				'file'  => 'planning.php',
				'fn'    => 'dwt_render_monte_carlo',
				'page'  => 'Will Your Money Last?',
			],
			'dwt_tax' => [
				'label' => 'Income tax — federal and state, with the bracket breakdown',
				'file'  => 'planning.php',
				'fn'    => 'dwt_render_tax',
				'page'  => 'What Will You Actually Pay?',
			],
			'dwt_estate_tax' => [
				'label' => 'Estate tax — what the estate owes and what reaches the heirs',
				'file'  => 'planning.php',
				'fn'    => 'dwt_render_estate_tax',
				'page'  => 'What Reaches Your Heirs?',
			],
			'dwt_mortgage' => [
				'label' => 'Mortgage elimination — seven values, with more detail optional',
				'file'  => 'planning.php',
				'fn'    => 'dwt_render_mortgage',
				'page'  => 'What Is The Mortgage Really Costing You?',
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
	 * Create one draft page per tool, each holding its shortcode.
	 *
	 * Runs on activation. Pages are created as DRAFTS, never published: this
	 * plugin is installed on a site it does not own, and publishing pages
	 * nobody has read onto a live firm's website is not a decision a plugin
	 * gets to make. The administrator reviews each one, adds their own copy
	 * around the shortcode, and publishes when ready.
	 *
	 * A tool already having a page is the normal case on reactivation, so an
	 * existing page with the same shortcode is left alone rather than
	 * duplicated. Deactivating the plugin does not delete anything.
	 */
	public static function create_pages(): array {
		$made = [];
		foreach ( self::catalog() as $tag => $info ) {
			if ( empty( $info['page'] ) ) {
				continue;
			}
			$existing = get_posts( [
				'post_type'      => 'page',
				'post_status'    => [ 'publish', 'draft', 'pending', 'private' ],
				's'              => '[' . $tag . ']',
				'posts_per_page' => 1,
				'fields'         => 'ids',
			] );
			if ( $existing ) {
				continue;
			}
			$id = wp_insert_post( [
				'post_title'   => $info['page'],
				'post_content' => '<!-- wp:shortcode -->[' . $tag . ']<!-- /wp:shortcode -->',
				'post_status'  => 'draft',
				'post_type'    => 'page',
			] );
			if ( $id && ! is_wp_error( $id ) ) {
				$made[ $tag ] = (int) $id;
			}
		}
		return $made;
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

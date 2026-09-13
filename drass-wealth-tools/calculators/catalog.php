<?php
/**
 * The engine catalogue.
 *
 * Lists the planning engines this site can present, pulled live from the
 * platform rather than typed into WordPress. That matters for one reason: a
 * hardcoded list goes stale the first time an engine is renamed or retired,
 * and nobody notices until a visitor clicks something that is not there.
 *
 * The platform returns only engines that are actually built. Items still in
 * development, and items that were dropped from the portfolio, are filtered
 * out server-side and never reach this page — so this list cannot advertise a
 * tool that does not exist.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function dwt_render_catalog( $atts = [] ): string {
	$a = shortcode_atts( [
		'columns' => '2',
		'heading' => 'Planning engines',
	], $atts, 'dwt_catalog' );

	wp_enqueue_style( 'dwt' );

	$res = DWT_API::get( 'catalog' );
	if ( is_wp_error( $res ) ) {
		return DWT_Shortcodes::render_refusal( $res );
	}

	$offered = isset( $res['offered'] ) && is_array( $res['offered'] ) ? $res['offered'] : [];
	if ( ! $offered ) {
		return DWT_Shortcodes::render_refusal( 'No engines are currently published for this site.' );
	}

	$cols = max( 1, min( 3, (int) $a['columns'] ) );

	$out  = '<div class="dwt dwt-catalog">';
	if ( '' !== trim( (string) $a['heading'] ) ) {
		$out .= '<h2 class="dwt-cat-h">' . esc_html( $a['heading'] ) . '</h2>';
	}
	$out .= '<p class="dwt-caption">' . esc_html(
		sprintf(
			'%d planning engines available on this site.',
			count( $offered )
		)
	) . '</p>';

	$out .= '<ul class="dwt-cat-grid dwt-cat-grid--' . (int) $cols . '">';
	foreach ( $offered as $item ) {
		$ref   = isset( $item['ref'] ) ? (string) $item['ref'] : '';
		$title = isset( $item['title'] ) ? (string) $item['title'] : '';
		if ( '' === $title ) {
			continue;
		}
		$out .= '<li class="dwt-cat-item">';
		$out .= '<span class="dwt-cat-title">' . esc_html( $title ) . '</span>';
		if ( '' !== $ref ) {
			$out .= '<span class="dwt-cat-ref">' . esc_html( $ref ) . '</span>';
		}
		$out .= '</li>';
	}
	$out .= '</ul>';

	// The intellectual-property line. This is printed VERBATIM from the
	// platform and is never composed here.
	//
	// Saying "patent pending" about an invention with no application on file
	// is false marking under 35 U.S.C. § 292, and since the AIA a competitor
	// injured by it can sue. This site has no way of knowing when that status
	// changes, so it does not get the ingredients to compose the sentence —
	// it gets the sentence. On the day a provisional is filed, the platform
	// changes and this page changes with it, with nothing edited here.
	//
	// Whoever maintains this site: do not replace this with your own wording,
	// and do not add "patent pending" to any page, banner or meta description.
	$ip = isset( $res['ip'] ) && is_array( $res['ip'] ) ? $res['ip'] : [];
	if ( ! empty( $ip['statusSentence'] ) ) {
		$out .= '<p class="dwt-cat-ip">' . esc_html( (string) $ip['statusSentence'] ) . '</p>';
	}

	$out .= '</div>';

	return $out;
}

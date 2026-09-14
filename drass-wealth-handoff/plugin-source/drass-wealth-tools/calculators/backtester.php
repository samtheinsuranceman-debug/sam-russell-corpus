<?php
/**
 * Index History — the educational view.
 *
 * ## What this is, and what it deliberately is not
 *
 * This shows real historical index changes and what a hypothetical policy
 * WOULD HAVE been credited had the cap, floor and participation rate shown
 * been applied. It is tied to no policy and projects nothing forward, which is
 * what makes it educational content rather than an illustration.
 *
 * It does not, and must not:
 *   - sit on a page beside a projection of a real client's policy values
 *   - carry forward a credited value into any illustrated account or
 *     surrender value
 *   - print a geometric average above the AG 49 maximum illustrated rate
 *
 * Those three are the rules the November 2025 amendment exists to enforce, and
 * they are checked by DWT_Compliance::guard_historical() before a single row
 * is drawn — not asserted in this comment.
 *
 * The value of this view is that 2008 and 2022 show the floor doing its job in
 * a year the index fell, and 1995 and 2023 show the cap taking the top off a
 * year it rose. Both facts are true, both are checkable, and neither needs a
 * number inflated to land.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function dwt_render_backtester( $atts = [] ): string {
	$a = shortcode_atts( [
		'index'         => 'SP500',
		'cap'           => '9.5',
		'floor'         => '0',
		'participation' => '100',
		'years'         => '30',
	], $atts, 'dwt_index_history' );

	wp_enqueue_style( 'dwt' );

	// Index history comes from the RCS platform, which is the single source of
	// truth for it. Duplicating a return series into this plugin would create a
	// second copy to correct every time the first one is corrected.
	$series = DWT_API::get( 'index-history', [
		'index' => sanitize_text_field( $a['index'] ),
		'years' => (string) absint( $a['years'] ),
	] );

	if ( is_wp_error( $series ) ) {
		return DWT_Shortcodes::render_refusal( $series );
	}

	$rows = isset( $series['years'] ) && is_array( $series['years'] ) ? $series['years'] : [];
	if ( ! $rows ) {
		return DWT_Shortcodes::render_refusal( 'No index history is available for that selection.' );
	}

	$cap   = (float) $a['cap'];
	$floor = (float) $a['floor'];
	$par   = (float) $a['participation'] / 100.0;

	// The gate. Refuses rather than warns.
	$ok = DWT_Compliance::guard_historical( [
		'mode'                   => DWT_Compliance::MODE_EDUCATIONAL,
		'index_age_years'        => (int) ( $series['index_age_years'] ?? count( $rows ) ),
		'years_shown'            => count( $rows ),
		'alongside_illustration' => false,
	] );
	if ( is_wp_error( $ok ) ) {
		return DWT_Shortcodes::render_refusal( $ok );
	}

	$out  = '<div class="dwt dwt-history">';
	$out .= DWT_Compliance::historical_notice_html();
	$out .= '<p class="dwt-caption">' . DWT_Compliance::would_have_been_caption() . '</p>';

	$out .= '<div class="dwt-tablewrap"><table class="dwt-table"><thead><tr>'
		. '<th scope="col">Year</th>'
		. '<th scope="col">Index change</th>'
		. '<th scope="col">Cap</th>'
		. '<th scope="col">Participation</th>'
		. '<th scope="col">Would have been credited</th>'
		. '</tr></thead><tbody>';

	foreach ( $rows as $r ) {
		$year   = isset( $r['year'] ) ? (int) $r['year'] : 0;
		$change = isset( $r['change'] ) ? (float) $r['change'] : 0.0;

		// Participation first, then the cap, then the floor. This is the order
		// the carrier applies them in, and applying the cap before
		// participation quietly overstates a high-par/low-cap design.
		$credited = $change * $par;
		if ( $credited > $cap )   { $credited = $cap; }
		if ( $credited < $floor ) { $credited = $floor; }

		$negative = $change < 0;
		$capped   = ( $change * $par ) > $cap;

		$out .= '<tr' . ( $negative ? ' class="dwt-row--floor"' : '' ) . '>';
		$out .= '<th scope="row">' . esc_html( (string) $year ) . '</th>';
		$out .= '<td>' . esc_html( number_format( $change, 2 ) ) . '%</td>';
		$out .= '<td>' . esc_html( number_format( $cap, 2 ) ) . '%</td>';
		$out .= '<td>' . esc_html( number_format( $par * 100, 0 ) ) . '%</td>';
		$out .= '<td class="dwt-credited">' . esc_html( number_format( $credited, 2 ) ) . '%';
		if ( $negative ) {
			$out .= ' <span class="dwt-tag dwt-tag--floor">floor held</span>';
		} elseif ( $capped ) {
			$out .= ' <span class="dwt-tag dwt-tag--cap">cap applied</span>';
		}
		$out .= '</td></tr>';
	}

	$out .= '</tbody></table></div>';

	// Deliberately no geometric average. Year-by-year is both more compliant
	// and more educational than an aggregate, and an aggregate above the AG 49
	// maximum illustrated rate may not be shown at all.
	$out .= '<p class="dwt-foot">Cap and participation rates are not guaranteed for the life of a '
		. 'policy and have changed materially over time. The rates shown here are the ones entered '
		. 'above, not a carrier quote.</p>';
	$out .= '</div>';

	return $out;
}

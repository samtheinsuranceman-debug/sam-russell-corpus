<?php
/**
 * Index segments — a two-year credit next to what it is a year.
 *
 * ## Why this view exists at all
 *
 * Somebody looked at a two-year balanced indexed account and reported that the
 * index "returned 40%+ four out of the last six years". On the sourced S&P 500
 * price series that is exactly right about the SEGMENTS: over 2019-2025 the
 * account's six rolling two-year segments credited 49.51%, 47.32%, 0%, 0%,
 * 53.42% and 43.07% — four of the six at 40% or more.
 *
 * It is wrong only about the unit. No single YEAR in that stretch came near
 * 40%; the best was 27.0%. That is an easy mistake to make and an expensive one
 * to publish, because a 47% two-year credit is 21.38% a year — excellent, and
 * well under half of what "47%" reads as when the term is not printed beside it.
 *
 * Note the two zeros. Two of the six segments credited nothing, one of them on
 * an index that was UP over the two years — 2.23% participated to 2.34%, less
 * the 2.50% spread, is below the floor. A view that shows the four good
 * segments without those two is showing four out of four.
 *
 * So this view prints three columns and never two: the index over the segment,
 * the credit for the segment WITH its term, and the annualized equivalent.
 * Only the third compares with an annual strategy, and it is the one the
 * summary figures are built from.
 *
 * ## What it is not
 *
 * Historical, educational, tied to no policy, projecting nothing forward. The
 * same rules that govern the index-history view govern this one, and the same
 * gate enforces them before a row is drawn.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function dwt_render_segments( $atts = [] ): string {
	$a = shortcode_atts( [
		'account'   => 'bia-2yr',
		'from'      => '',
		'to'        => '',
		'threshold' => '40',
	], $atts, 'dwt_index_segments' );

	wp_enqueue_style( 'dwt' );

	$params = [ 'account' => sanitize_text_field( $a['account'] ) ];
	if ( '' !== $a['from'] ) {
		$params['from'] = (string) absint( $a['from'] );
	}
	if ( '' !== $a['to'] ) {
		$params['to'] = (string) absint( $a['to'] );
	}
	$params['threshold'] = (string) absint( $a['threshold'] );

	// The segment arithmetic lives on the RCS platform, once. A PHP copy of it
	// would be a second place for the participation rate and the spread to
	// drift out of agreement with the carrier document.
	$data = DWT_API::get( 'index-segments', $params );
	if ( is_wp_error( $data ) ) {
		return DWT_Shortcodes::render_refusal( $data );
	}

	$segments = isset( $data['segments'] ) && is_array( $data['segments'] ) ? $data['segments'] : [];
	if ( ! $segments ) {
		return DWT_Shortcodes::render_refusal(
			'That window is shorter than one segment term, so there is nothing complete to show.'
		);
	}

	$acct = isset( $data['account'] ) && is_array( $data['account'] ) ? $data['account'] : [];
	$term = isset( $acct['term_years'] ) ? (int) $acct['term_years'] : 1;

	$ok = DWT_Compliance::guard_historical( [
		'mode'                   => DWT_Compliance::MODE_EDUCATIONAL,
		'index_age_years'        => 30,
		'years_shown'            => count( $segments ),
		'alongside_illustration' => false,
	] );
	if ( is_wp_error( $ok ) ) {
		return DWT_Shortcodes::render_refusal( $ok );
	}

	$out  = '<div class="dwt dwt-segments">';
	$out .= DWT_Compliance::historical_notice_html();

	// The platform reports whether the index series behind these figures
	// reconciles to the carrier's own published claims. When it does not, that
	// belongs at the top of the tool in the visitor's face, not in a footnote —
	// a figure whose provenance is unknown must say so on the same screen.
	if ( empty( $data['series_verified'] ) && ! empty( $data['series_warning'] ) ) {
		$out .= '<p class="dwt-stop"><strong>These figures are not yet verified.</strong> '
			. esc_html( (string) $data['series_warning'] ) . '</p>';
	}

	// An unsourced parameter set says so above the table, not in a footnote.
	// Somebody reading only the numbers has to be able to see that nobody
	// quoted them.
	if ( empty( $acct['sourced'] ) ) {
		$out .= '<p class="dwt-warn"><strong>These terms came from nobody.</strong> They are a '
			. 'parameter set for comparison, not a carrier quote, and must not be presented as a '
			. 'product that can be bought.</p>';
	}

	$out .= '<p class="dwt-caption">' . DWT_Compliance::would_have_been_caption() . '</p>';

	if ( $term > 1 ) {
		$out .= '<p class="dwt-lede">Each row below is a <strong>' . esc_html( (string) $term )
			. '-year segment</strong>, not a year. The account credits once across the whole term, '
			. 'so the credited column and the per-year column are different numbers. '
			. '<strong>The carrier publishes this account on the per-year basis, net of the spread</strong> — '
			. 'that is the last column, and it is the only one that may be set beside a carrier chart.</p>';
	}

	// The account's terms, so the arithmetic in the table is checkable.
	$out .= '<p class="dwt-foot">'
		. esc_html( (string) ( $acct['name'] ?? 'Index segment' ) ) . ' — '
		. esc_html( (string) $term ) . '-year term, '
		. esc_html( number_format( (float) ( $acct['participation_pct'] ?? 100 ), 0 ) ) . '% participation, '
		. esc_html( number_format( (float) ( $acct['spread_pct'] ?? 0 ), 2 ) ) . '% spread, '
		. ( null === ( $acct['cap_pct'] ?? null )
			? 'uncapped'
			: esc_html( number_format( (float) $acct['cap_pct'], 2 ) ) . '% cap' ) . ', '
		. esc_html( number_format( (float) ( $acct['floor_pct'] ?? 0 ), 0 ) ) . '% floor.<br>'
		. esc_html( (string) ( $acct['source'] ?? '' ) )
		. '</p>';

	$out .= '<div class="dwt-tablewrap"><table class="dwt-table"><thead><tr>'
		. '<th scope="col">Segment</th>'
		. '<th scope="col">Index over the segment</th>'
		. '<th scope="col">Credited over the segment</th>'
		. '<th scope="col">Per year — the carrier\'s published basis</th>'
		. '</tr></thead><tbody>';

	foreach ( $segments as $sg ) {
		$start     = isset( $sg['start_year'] ) ? (int) $sg['start_year'] : 0;
		$end       = isset( $sg['end_year'] ) ? (int) $sg['end_year'] : 0;
		$idx       = isset( $sg['index_cumulative_pct'] ) ? (float) $sg['index_cumulative_pct'] : 0.0;
		$credited  = isset( $sg['credited_pct'] ) ? (float) $sg['credited_pct'] : 0.0;
		$annual    = isset( $sg['carrier_basis_pct'] )
			? (float) $sg['carrier_basis_pct']
			: ( isset( $sg['annualized_pct'] ) ? (float) $sg['annualized_pct'] : 0.0 );
		$seg_years = isset( $sg['term_years'] ) ? (int) $sg['term_years'] : $term;
		$floored   = ! empty( $sg['floor_saved'] );
		$capped    = ! empty( $sg['cap_bit'] );

		$label = $start === $end ? (string) $start : $start . '–' . $end;

		$out .= '<tr' . ( $idx < 0 ? ' class="dwt-row--floor"' : '' ) . '>';
		$out .= '<th scope="row">' . esc_html( $label ) . '</th>';
		$out .= '<td>' . esc_html( number_format( $idx, 2 ) ) . '%</td>';
		$out .= '<td class="dwt-credited">' . esc_html( number_format( $credited, 2 ) ) . '%';
		if ( $seg_years > 1 ) {
			// The term travels with the number, in the same cell. A reader who
			// skims one column must not be able to read it as annual.
			$out .= ' <span class="dwt-tag">over ' . esc_html( (string) $seg_years ) . ' yrs</span>';
		}
		if ( $floored ) {
			$out .= ' <span class="dwt-tag dwt-tag--floor">floor held</span>';
		} elseif ( $capped ) {
			$out .= ' <span class="dwt-tag dwt-tag--cap">cap applied</span>';
		}
		$out .= '</td>';
		$out .= '<td class="dwt-credited">' . esc_html( number_format( $annual, 2 ) ) . '% / yr</td>';
		$out .= '</tr>';
	}

	$out .= '</tbody></table></div>';

	// The summary is stated on the annualized basis, and the count of segments
	// over the threshold says "segments" so it cannot be read as "years".
	$count = isset( $data['segments_at_or_above_threshold'] ) ? (int) $data['segments_at_or_above_threshold'] : 0;
	$thr   = isset( $data['threshold_pct'] ) ? (float) $data['threshold_pct'] : 40.0;
	$out  .= '<p class="dwt-foot"><strong>' . esc_html( (string) $count ) . '</strong> of '
		. esc_html( (string) count( $segments ) ) . ' segments credited '
		. esc_html( number_format( $thr, 0 ) ) . '% or more over their full term. '
		. 'On the comparable per-year basis this window averaged '
		. esc_html( number_format( (float) ( $data['mean_annualized_pct'] ?? 0 ), 2 ) ) . '%, '
		. 'best ' . esc_html( number_format( (float) ( $data['best_annualized_pct'] ?? 0 ), 2 ) ) . '%, '
		. 'worst ' . esc_html( number_format( (float) ( $data['worst_annualized_pct'] ?? 0 ), 2 ) ) . '%.</p>';

	if ( ! empty( $data['reading_note'] ) ) {
		$out .= '<p class="dwt-foot">' . esc_html( (string) $data['reading_note'] ) . '</p>';
	}

	$out .= '<p class="dwt-foot">Participation rates, spreads and caps are not guaranteed for the '
		. 'life of a policy and have changed materially over time. Past index changes do not '
		. 'predict future ones.</p>';
	$out .= '</div>';

	return $out;
}

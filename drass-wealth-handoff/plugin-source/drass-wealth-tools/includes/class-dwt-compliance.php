<?php
/**
 * NAIC Actuarial Guideline 49-A / 49-B compliance guard.
 *
 * This is not a disclaimer printer. It is a gate. Every historical-data view
 * in this plugin must pass through guard_historical() before it renders, and
 * that method refuses rather than warns. A compliance rule that is a comment
 * is a compliance rule that gets edited out at 2am by whoever is in a hurry.
 *
 * ## The rules this encodes
 *
 * AG 49 (2015) set the maximum illustrated rate. AG 49-A (2020) closed the
 * indexed-loan arbitrage. AG 49-B (May 2023) capped volatility-controlled
 * accounts at the benchmark S&P 500 level. The amendment adopted 21 Nov 2025
 * binds policies sold on or after 1 April 2026 and is what most code in the
 * wild has not caught up with:
 *
 *   - historical data period rises from 20 years to 25
 *   - a table needs at least 10 years of index history to be shown at all
 *   - side-by-side historical vs illustrated comparison: PROHIBITED
 *     (it was merely discouraged before; a 2024 multi-state review found
 *      multiple insurers doing it, which is why it is now banned)
 *   - backtested performance for an index under 10 years old: PROHIBITED
 *   - the disclaimer below is MANDATORY and verbatim, and belongs at the top
 *     of the data section — a footnote does not satisfy it
 *
 * ## The distinction everything hangs on
 *
 * An ILLUSTRATION projects future values for a specific policy and is bound by
 * the maximum illustrated rate. An EDUCATIONAL view explains how caps, floors
 * and participation rates behaved against real index history, is tied to no
 * policy, and projects nothing forward. The second has materially more room,
 * which is why every historical view here is built as MODE_EDUCATIONAL and
 * why the two are not permitted to share a screen.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class DWT_Compliance {

	/** Educational: explains mechanics against real history. Projects nothing. */
	const MODE_EDUCATIONAL = 'educational';

	/** Illustration: projects future values for a policy. Rate-capped. */
	const MODE_ILLUSTRATION = 'illustration';

	/**
	 * Verbatim. Required by the 21 Nov 2025 amendment for policies sold on or
	 * after 1 April 2026. Do not paraphrase this string — "past performance is
	 * not indicative of future results" is the common paraphrase and it is not
	 * the required text.
	 */
	const MANDATED_HISTORICAL_NOTICE =
		'Historical index changes shown in this illustration are not indicative of future returns.';

	/** Minimum years of index history before a table may be rendered at all. */
	const MIN_INDEX_HISTORY_YEARS = 10;

	/** Historical window required post-April 2026. Was 20. */
	const HISTORICAL_PERIOD_YEARS = 25;

	/**
	 * Decide whether a historical view may render.
	 *
	 * Returns true to proceed, or a WP_Error naming the specific rule that
	 * blocked it. Callers must treat WP_Error as "render the refusal, not the
	 * table" — see DWT_Shortcodes::render_refusal().
	 *
	 * @param array $args {
	 *   @type string $mode            MODE_EDUCATIONAL or MODE_ILLUSTRATION.
	 *   @type int    $index_age_years Age of the index itself, in years.
	 *   @type int    $years_shown     How many years of data the view shows.
	 *   @type bool   $alongside_illustration Whether a policy illustration is
	 *                                 rendered on the same screen.
	 *   @type float|null $geometric_average_shown Credited-rate geometric mean
	 *                                 the view intends to print, if any.
	 *   @type float|null $ag49_max_illustrated_rate The carrier's AG 49 maximum
	 *                                 illustrated rate, for comparison.
	 * }
	 * @return true|WP_Error
	 */
	public static function guard_historical( array $args ) {
		$a = wp_parse_args( $args, [
			'mode'                      => self::MODE_EDUCATIONAL,
			'index_age_years'           => 0,
			'years_shown'               => 0,
			'alongside_illustration'    => false,
			'geometric_average_shown'   => null,
			'ag49_max_illustrated_rate' => null,
		] );

		// Prohibited outright since 1 April 2026. This is the rule the
		// "show them both and let them draw the conclusion" idea runs into,
		// and no amount of relabelling the columns gets around it.
		if ( $a['alongside_illustration'] ) {
			return new WP_Error(
				'dwt_side_by_side_prohibited',
				'A side-by-side comparison of historical index data and an illustration of projected policy values is prohibited under the AG 49-A amendment adopted 21 November 2025. Show the educational history on its own screen.'
			);
		}

		// An index without a real track record cannot be backtested. Vendors
		// launch an index, backtest it against invented history, and illustrate
		// the result. That is precisely what this clause stops.
		if ( (int) $a['index_age_years'] < self::MIN_INDEX_HISTORY_YEARS ) {
			return new WP_Error(
				'dwt_index_too_young',
				sprintf(
					'This index has %d years of history. Backtested performance may not be shown for an index less than %d years old.',
					(int) $a['index_age_years'],
					self::MIN_INDEX_HISTORY_YEARS
				)
			);
		}

		if ( (int) $a['years_shown'] < self::MIN_INDEX_HISTORY_YEARS ) {
			return new WP_Error(
				'dwt_too_few_years',
				sprintf(
					'A historical table requires at least %d years of index history.',
					self::MIN_INDEX_HISTORY_YEARS
				)
			);
		}

		// A geometric average above the maximum illustrated rate is the exact
		// practice the 2024 multi-state review flagged. Year-by-year rows are
		// both more compliant and more useful, so that is what we show instead.
		if ( null !== $a['geometric_average_shown'] && null !== $a['ag49_max_illustrated_rate'] ) {
			if ( (float) $a['geometric_average_shown'] > (float) $a['ag49_max_illustrated_rate'] ) {
				return new WP_Error(
					'dwt_geometric_above_max',
					sprintf(
						'A geometric average credited rate of %.2f%% exceeds the AG 49 maximum illustrated rate of %.2f%% and may not be displayed. Show year-by-year credited values instead.',
						(float) $a['geometric_average_shown'],
						(float) $a['ag49_max_illustrated_rate']
					)
				);
			}
		}

		return true;
	}

	/**
	 * The mandated notice, rendered as a prominent block.
	 *
	 * Deliberately has no "footnote" or "compact" variant. The amendment
	 * requires this at the top of the data section; offering a small variant
	 * would guarantee somebody used it in a footer and believed they were
	 * covered.
	 */
	public static function historical_notice_html(): string {
		return '<div class="dwt-notice dwt-notice--mandated" role="note">'
			. '<strong>' . esc_html( self::MANDATED_HISTORICAL_NOTICE ) . '</strong>'
			. '<p>' . esc_html(
				'The figures below show what would have been credited to a hypothetical policy had the cap, floor and participation rates shown been applied to the actual historical index changes. They are educational. They are not a projection of any policy, and no policy is being illustrated here.'
			) . '</p>'
			. '</div>';
	}

	/**
	 * Framing language for a historical column header.
	 *
	 * North American Company's wording is the model the April 2026 report
	 * singles out: it separates market reality from product mechanics in one
	 * sentence, which is what regulators are actually looking for.
	 */
	public static function would_have_been_caption(): string {
		return esc_html__(
			'The following shows actual historical index changes, alongside what the policy performance would have been had the current index cap and participation rates been applied.',
			'drass-wealth-tools'
		);
	}
}

<?php
/**
 * The three planning calculators: Monte Carlo, income tax, estate tax.
 *
 * Each one is a form and a result panel. The visitor types numbers, the
 * browser asks WordPress, WordPress asks the platform, and the answer comes
 * back. Nothing is stored at any step — no lead record, no cookie, no log
 * line with the figures in it. That is deliberate: a public calculator that
 * quietly banks what people type is a data-protection problem nobody signed
 * up for, and none of these need the visitor's identity to work.
 *
 * The platform returns a `basis` sentence with every answer explaining what
 * the number is and is not. It is printed with the result and must not be
 * removed — it is the difference between an estimate and a promise.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Server-side proxy, one handler for all three tools.
 *
 * The browser never talks to the platform and never sees the bearer token.
 * It posts to admin-ajax with a nonce, WordPress makes the outbound call, and
 * only the answer comes back. This is the same shape as the concierge handler
 * and for the same reason: an API key in page script is a key you have given
 * away.
 *
 * The tool name is checked against a fixed list rather than passed through.
 * Without that, this endpoint would be an open proxy to any path on the
 * platform for anyone who can load a page.
 */
const DWT_PLAN_TOOLS = [ 'monte-carlo', 'tax', 'estate-tax', 'mortgage' ];

function dwt_ajax_plan(): void {
	check_ajax_referer( 'dwt_plan', 'nonce' );

	$tool = isset( $_POST['tool'] ) ? sanitize_key( wp_unslash( $_POST['tool'] ) ) : '';
	if ( ! in_array( $tool, DWT_PLAN_TOOLS, true ) ) {
		wp_send_json_error( [ 'detail' => 'Unknown tool.' ], 400 );
	}

	// Only these keys are forwarded, and each is cast to the shape the
	// platform expects. The platform clamps every number again on its side —
	// two checks rather than one, because this one runs on a host we do not
	// control.
	$allowed = [
		'initial', 'contribution', 'years', 'return', 'volatility', 'inflation',
		'income', 'filing', 'state',
		'estate', 'debts', 'charity', 'age', 'beneficiaries',
		'balance', 'termMonths', 'payment', 'homeValue',
		'allocationPct', 'helocRate', 'cap', 'floor', 'participation',
		'window', 'indexStartYear', 'indexEndYear',
		'ira', 'cash', 'investments', 'annuities', 'other', 'crypto',
	];
	$args = [];
	foreach ( $allowed as $key ) {
		if ( ! isset( $_POST[ $key ] ) ) {
			continue;
		}
		$raw = sanitize_text_field( wp_unslash( $_POST[ $key ] ) );
		if ( '' === $raw ) {
			continue;
		}
		$args[ $key ] = in_array( $key, [ 'filing', 'state' ], true ) ? $raw : (float) $raw;
	}

	$res = DWT_API::get( $tool, $args );
	if ( is_wp_error( $res ) ) {
		wp_send_json_error( [ 'detail' => $res->get_error_message() ], 503 );
	}
	wp_send_json_success( $res );
}
add_action( 'wp_ajax_dwt_plan', 'dwt_ajax_plan' );
add_action( 'wp_ajax_nopriv_dwt_plan', 'dwt_ajax_plan' );

/** Shared shell so the three tools look like one family. */
function dwt_planning_shell( string $slug, string $heading, string $fields, string $cta ): string {
	wp_enqueue_style( 'dwt' );
	wp_enqueue_script( 'dwt-planning', DWT_URL . 'assets/dwt-planning.js', [], DWT_VERSION, true );
	wp_localize_script( 'dwt-planning', 'DWT_PLAN', [
		'ajax'  => admin_url( 'admin-ajax.php' ),
		'nonce' => wp_create_nonce( 'dwt_plan' ),
	] );

	$out  = '<div class="dwt dwt-plan" data-dwt-plan="' . esc_attr( $slug ) . '">';
	if ( '' !== trim( $heading ) ) {
		$out .= '<h2 class="dwt-cat-h">' . esc_html( $heading ) . '</h2>';
	}
	$out .= '<form class="dwt-plan-form" novalidate>' . $fields;
	$out .= '<button type="submit" class="dwt-plan-go">' . esc_html( $cta ) . '</button>';
	$out .= '</form>';
	$out .= '<div class="dwt-plan-out" role="status" aria-live="polite"></div>';
	$out .= '</div>';
	return $out;
}

function dwt_plan_number( string $name, string $label, $value, $step = '1000' ): string {
	$id = 'dwt-' . $name . '-' . wp_rand( 1000, 9999 );
	return '<p class="dwt-plan-row"><label for="' . esc_attr( $id ) . '">' . esc_html( $label ) . '</label>'
		. '<input id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '" type="number" inputmode="decimal"'
		. ' step="' . esc_attr( $step ) . '" value="' . esc_attr( (string) $value ) . '" /></p>';
}

function dwt_plan_select( string $name, string $label, array $options, string $selected ): string {
	$id = 'dwt-' . $name . '-' . wp_rand( 1000, 9999 );
	$out = '<p class="dwt-plan-row"><label for="' . esc_attr( $id ) . '">' . esc_html( $label ) . '</label>'
		. '<select id="' . esc_attr( $id ) . '" name="' . esc_attr( $name ) . '">';
	foreach ( $options as $val => $text ) {
		$out .= '<option value="' . esc_attr( (string) $val ) . '"' . selected( $selected, (string) $val, false ) . '>'
			. esc_html( (string) $text ) . '</option>';
	}
	return $out . '</select></p>';
}

// ── Monte Carlo ────────────────────────────────────────────────────────────
function dwt_render_monte_carlo( $atts = [] ): string {
	$a = shortcode_atts( [ 'heading' => 'Will the money last?' ], $atts, 'dwt_monte_carlo' );
	if ( ! DWT_API::configured() ) {
		return DWT_Shortcodes::render_refusal( 'This tool is not configured yet.' );
	}
	$f  = dwt_plan_number( 'initial', 'Starting balance', 500000 );
	$f .= dwt_plan_number( 'contribution', 'Added each year (use a negative number to withdraw)', 0 );
	$f .= dwt_plan_number( 'years', 'Years to project', 30, '1' );
	$f .= dwt_plan_number( 'return', 'Expected return, % a year', 7, '0.1' );
	$f .= dwt_plan_number( 'volatility', 'Volatility, % a year', 15, '0.1' );
	return dwt_planning_shell( 'monte-carlo', $a['heading'], $f, 'Run the projection' );
}

// ── Income tax ─────────────────────────────────────────────────────────────
function dwt_render_tax( $atts = [] ): string {
	$a = shortcode_atts( [ 'heading' => 'What will you actually pay?', 'state' => 'TX' ], $atts, 'dwt_tax' );
	if ( ! DWT_API::configured() ) {
		return DWT_Shortcodes::render_refusal( 'This tool is not configured yet.' );
	}
	$f  = dwt_plan_number( 'income', 'Gross household income', 400000 );
	$f .= dwt_plan_select( 'filing', 'Filing status', [
		'single' => 'Single',
		'joint'  => 'Married filing jointly',
		'hoh'    => 'Head of household',
	], 'joint' );
	$f .= '<p class="dwt-plan-row"><label>State</label><input name="state" type="text" maxlength="2"'
		. ' value="' . esc_attr( strtoupper( substr( (string) $a['state'], 0, 2 ) ) ) . '" /></p>';
	return dwt_planning_shell( 'tax', $a['heading'], $f, 'Work out the tax' );
}

// ── Estate tax ─────────────────────────────────────────────────────────────
function dwt_render_estate_tax( $atts = [] ): string {
	$a = shortcode_atts( [ 'heading' => 'What reaches your heirs?' ], $atts, 'dwt_estate_tax' );
	if ( ! DWT_API::configured() ) {
		return DWT_Shortcodes::render_refusal( 'This tool is not configured yet.' );
	}
	$f  = dwt_plan_number( 'estate', 'Total estate today', 30000000, '100000' );
	$f .= dwt_plan_number( 'debts', 'Debts and mortgages', 0, '100000' );
	$f .= dwt_plan_number( 'charity', 'Charitable bequests', 0, '100000' );
	$f .= dwt_plan_select( 'filing', 'Filing status', [
		'married' => 'Married',
		'single'  => 'Single',
	], 'married' );
	return dwt_planning_shell( 'estate-tax', $a['heading'], $f, 'Work out the estate tax' );
}

// ── Mortgage elimination ───────────────────────────────────────────────────
/**
 * Seven values get an answer. Everything else is optional and sits behind a
 * disclosure, because a form with twenty-five boxes is a form nobody finishes
 * — and the engine has a sensible default for every one of them.
 */
function dwt_render_mortgage( $atts = [] ): string {
	$a = shortcode_atts( [ 'heading' => 'What is the mortgage really costing you?' ], $atts, 'dwt_mortgage' );
	if ( ! DWT_API::configured() ) {
		return DWT_Shortcodes::render_refusal( 'This tool is not configured yet.' );
	}

	$f  = dwt_plan_number( 'balance', 'Mortgage balance', 650000, '1000' );
	$f .= dwt_plan_number( 'rate', 'Interest rate, %', 6.75, '0.01' );
	$f .= dwt_plan_number( 'termMonths', 'Months remaining', 360, '1' );
	$f .= dwt_plan_number( 'payment', 'Monthly payment', 4216, '10' );
	$f .= dwt_plan_number( 'homeValue', 'What the home is worth', 900000, '1000' );
	$f .= dwt_plan_number( 'income', 'Annual household income', 450000, '1000' );
	$f .= dwt_plan_number( 'age', 'Your age', 45, '1' );

	// The index strategy and the period it is measured over. Both shift the
	// crediting assumption, and neither is a number anyone types — the platform
	// derives the rate from whichever strategy and window are chosen, and
	// returns the full history beside it whatever is picked.
	$f .= dwt_plan_select( 'window', 'Measure the crediting over', [
		'full'   => 'Everything on record (1929 to today)',
		'ag49'   => 'The AG 49-A lookback (25 years)',
		'thirty' => 'The last thirty years',
		'dotcom' => 'Since the dot-com peak (2000)',
		'crisis' => 'Since the financial crisis peak (2007)',
		'covid'  => 'Since Covid (2020)',
	], 'full' );

	$f .= '<details class="dwt-plan-more"><summary>Add more detail (optional)</summary>';
	$f .= '<p class="dwt-plan-hint">Every field below already has a sensible default. Answer as many or as few as you like.</p>';
	$f .= dwt_plan_number( 'cap', 'Policy cap, % (blank for uncapped)', 7.5, '0.25' );
	$f .= dwt_plan_number( 'participation', 'Participation rate, %', 100, '1' );
	$f .= dwt_plan_number( 'floor', 'Policy floor, %', 0, '0.25' );
	$f .= dwt_plan_number( 'allocationPct', 'Share of income to allocate, %', 20, '1' );
	$f .= dwt_plan_number( 'helocRate', 'Line-of-credit rate, %', 8.5, '0.01' );
	$f .= dwt_plan_number( 'ira', 'IRA and 401(k) balances', 0, '1000' );
	$f .= dwt_plan_number( 'cash', 'Cash and savings', 0, '1000' );
	$f .= dwt_plan_number( 'investments', 'Taxable investments', 0, '1000' );
	$f .= dwt_plan_number( 'annuities', 'Annuities', 0, '1000' );
	$f .= dwt_plan_number( 'other', 'Other investments', 0, '1000' );
	$f .= '</details>';

	return dwt_planning_shell( 'mortgage', $a['heading'], $f, 'Run the analysis' );
}

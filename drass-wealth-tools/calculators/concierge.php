<?php
/**
 * The concierge — ask a question by voice or by typing.
 *
 * ## Where the audio goes: nowhere
 *
 * Speech is recognised by the visitor's own browser using the Web Speech API.
 * No audio is recorded, uploaded or stored, by this site or by the platform.
 * Only the resulting text is sent. The page says so out loud, because a
 * microphone on a financial website is a reasonable thing to be wary of and
 * the honest answer happens to be the reassuring one.
 *
 * ## Where the key goes: not into the page
 *
 * The browser never calls the platform directly. It posts to WordPress's own
 * admin-ajax endpoint, and this server makes the outbound call with the API
 * key. If the browser held the key, every visitor would hold the key.
 *
 * ## What the answer may contain
 *
 * Concepts, frames and general sequences. No dollar amounts, no percentages,
 * no formulas, no product names. That is enforced on the platform in the
 * system prompt and again by a filter over whatever the model returns — a
 * prompt is a request, a filter is a guarantee. Nothing about the firm's
 * method leaves through this box.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/** Server-side proxy. Keeps the bearer token out of the browser. */
function dwt_ajax_ask(): void {
	check_ajax_referer( 'dwt_ask', 'nonce' );

	$q = isset( $_POST['q'] ) ? sanitize_text_field( wp_unslash( $_POST['q'] ) ) : '';
	$q = trim( mb_substr( $q, 0, 600 ) );
	if ( mb_strlen( $q ) < 3 ) {
		wp_send_json_error( [ 'detail' => 'Ask a question first.' ], 400 );
	}

	$res = DWT_API::get( 'ask', [ 'q' => $q ] );
	if ( is_wp_error( $res ) ) {
		wp_send_json_error( [ 'detail' => $res->get_error_message() ], 503 );
	}

	wp_send_json_success( [
		'answer'     => isset( $res['answer'] ) ? (string) $res['answer'] : '',
		'booking'    => isset( $res['booking'] ) ? (string) $res['booking'] : '',
		'disclosure' => isset( $res['disclosure'] ) ? (string) $res['disclosure'] : '',
	] );
}
add_action( 'wp_ajax_dwt_ask', 'dwt_ajax_ask' );
add_action( 'wp_ajax_nopriv_dwt_ask', 'dwt_ajax_ask' );

function dwt_render_concierge( $atts = [] ): string {
	$a = shortcode_atts( [
		'heading'     => 'Ask us anything',
		'placeholder' => 'Ask about Roth conversions, retirement income, taxes in retirement…',
		'cta'         => 'Book a conversation',
	], $atts, 'dwt_concierge' );

	wp_enqueue_style( 'dwt' );
	wp_enqueue_script( 'dwt-concierge', DWT_URL . 'assets/dwt-concierge.js', [], DWT_VERSION, true );
	wp_localize_script( 'dwt-concierge', 'DWT_ASK', [
		'ajax'  => admin_url( 'admin-ajax.php' ),
		'nonce' => wp_create_nonce( 'dwt_ask' ),
		'cta'   => (string) $a['cta'],
	] );

	// The ten questions a visitor actually has. Offered as chips so somebody
	// who does not know what to ask still gets a useful first answer — an
	// empty box is the most common reason these are never used.
	$suggested = [
		'Should I convert to a Roth, and when?',
		'How do I make my retirement income last?',
		'What order should I withdraw from my accounts?',
		'How do taxes change once I stop working?',
		'What happens to my money if I need long-term care?',
		'How do I leave more to my family and less to the IRS?',
		'Am I saving enough to retire when I want to?',
		'What should I do with an old 401(k)?',
		'How do I protect what I have from a market drop?',
		'When should I claim Social Security?',
	];

	ob_start(); ?>
	<div class="dwt dwt-concierge" data-dwt-concierge>
		<h2 class="dwt-cat-h"><?php echo esc_html( $a['heading'] ); ?></h2>

		<div class="dwt-ask-row">
			<button type="button" class="dwt-mic" data-dwt-mic aria-label="Ask by voice" hidden>
				<span class="dwt-mic-dot"></span><span class="dwt-mic-label">Speak</span>
			</button>
			<label class="screen-reader-text" for="dwt-q">Your question</label>
			<input type="text" id="dwt-q" class="dwt-ask-input" data-dwt-q
				placeholder="<?php echo esc_attr( $a['placeholder'] ); ?>" maxlength="600" autocomplete="off">
			<button type="button" class="dwt-ask-go" data-dwt-go>Ask</button>
		</div>

		<p class="dwt-privacy" data-dwt-privacy hidden>
			Speech is recognised in your own browser. No audio is uploaded, recorded or stored.
		</p>

		<div class="dwt-chips">
			<?php foreach ( $suggested as $s ) : ?>
				<button type="button" class="dwt-chip" data-dwt-chip><?php echo esc_html( $s ); ?></button>
			<?php endforeach; ?>
		</div>

		<div class="dwt-answer" data-dwt-answer hidden></div>

		<p class="dwt-foot" data-dwt-disclosure hidden></p>
	</div>
	<?php
	return (string) ob_get_clean();
}

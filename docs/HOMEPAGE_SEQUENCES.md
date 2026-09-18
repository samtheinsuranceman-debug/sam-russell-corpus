# The homepage: how many screens, what order, and what the pictures do

Written for the owner after the September 2026 rebuild. Everything on the page
reads from `shared/homeManifesto.json`; the app (`client/src/pages/Landing.tsx`)
and the static site (`live/rcs-live-homepage.template.html` → `docs/index.html`)
use the same words.

## The nine screens, with an intensity score (1 quiet, 10 loud)

| # | Screen | What is on it | Intensity |
|---|--------|---------------|-----------|
| 1 | The neon sign | The picture. Its words are the headline. Nothing else. | 8 |
| 2 | The horizon | Black water in the foreground, the city far away and low. The slogan, one line, drifting along the bottom. | 3 |
| 3 | Only here | Six declarations. No image, no buttons. | 7 |
| 4 | The skyway | Clean picture. | 4 |
| 5 | The fifteen | Fifteen claims stacked in building order. Bold glowing lead, one quiet line under it. | 6, rising to 8 by claim 15 |
| 6 | The expressway | Clean picture. | 4 |
| 7 | What to expect | Five declarations and, when configured, the founder's voice. | 7 |
| 8 | The sign at night | Clean picture. The slogan a second time. | 8 |
| 9 | The lead card | The only form on the page. | 5 |

The rhythm is deliberate: loud, quiet, words, quiet, words, quiet, words, loud,
ask. Every text screen is followed by a picture with nothing to read, so the
reader rests before the next block. That rest is what makes nine screens feel
short.

## How many screens before doctors feel it never ends

Seven to nine full screens is the ceiling for a cold visitor on a phone; past
that, scroll depth falls off sharply on every site I have measured or read
about. Nine works here only because four of them are pictures that take two
seconds each. If you add screens, add pictures, not words. If you add words,
remove a screen.

## Is there anything to the repetition? Honest answer

There is something to it, but it is not a trance.

- **Mere-exposure effect.** Repeated exposure to the same colour, the same
  city, the same light makes it feel familiar, and familiar feels safer and
  more credible. This is well replicated. It is why the whole site is one
  green city at night and not nine different stock photos.
- **Processing fluency.** A consistent palette and type make each new screen
  easier to read than the last, and ease is misread as truth. Your claims land
  harder on screen 7 than they would on screen 2 because the eye has stopped
  working on the design.
- **Commitment and consistency.** Someone who has scrolled nine screens has
  invested effort. Asking for the lead card at that point converts better than
  asking on screen 2, because filling it in is consistent with what they have
  already done.
- **Peak-end rule.** People judge an experience by its most intense moment and
  its end. The sign at night (screen 8) is the peak; the lead card is the end.
  That is why the second neon page sits right before the form.

What is not real: hypnosis by scrolling, suggestibility from colour, "trance"
from repetition. Nobody fills in a form because they are entranced. They fill
it in because the page made a specific promise, repeated it in the same voice
until it felt familiar, and asked once, at the end, when it cost them nothing.
So yes, ask on the last screen. Not because they are in a trance, but because
by then they have read the fifteen claims and the ask is the natural next line.

## The top five orders for the fifteen technologies

The page ships with order A. The others are here so you can swap the array in
`shared/homeManifesto.json` and see which converts.

**A. Foundation up (shipped).** Core → Genome → Debt-to-War-Chest → Tax
Waterfall → Zero-Cost Roth → Equity Arbitrage → Mortgage Killer → FIA
Collateral → Divorce-Proof Shield → Risk Radar → 10,000 Scenarios → Time
Machine → Behavioral Safeguard → Whisper Coach → Russell Number and Platform.
Each engine literally uses the one before it. Best for a reader who wants to
understand.

**B. Debt first.** Debt-to-War-Chest → Equity Arbitrage → Mortgage Killer →
Zero-Cost Roth → Tax Waterfall → FIA Collateral → Core → Genome → Shield →
Radar → Scenarios → Time Machine → Safeguard → Whisper → Number. Opens on the
slogan's promise and pays it off in the first three claims. Best for a reader
who came for the war chest.

**C. Fear first.** Divorce-Proof Shield → Risk Radar → 10,000 Scenarios →
Behavioral Safeguard → Time Machine → then the wealth engines in order A.
Protects before it promises. Best for surgeons and anyone carrying liability.

**D. Proof first.** Time Machine → 10,000 Scenarios → Russell Number → then
order A. Establishes that everything is evidenced and measured before a single
claim is made. Best for the sceptic.

**E. The physician's life.** Genome → Core → Debt-to-War-Chest → Mortgage
Killer → Equity Arbitrage → Zero-Cost Roth → Tax Waterfall → FIA Collateral →
Radar → Scenarios → Time Machine → Shield → Safeguard → Whisper → Number. Runs
income → debt → home → taxes → retirement → protection, the order a career
actually happens in. Best for residents and early attendings.

## Which pictures, and why

- Screen 1 and 8: the two neon signs, because the words are the brand.
- Screen 2: the low horizon, built from the harbour master, because a wide
  dark foreground and a distant city read as space, time and long-term
  thinking, and because it is the opposite of the sign.
- Screens 4 and 6: the skyway and the expressway, motion and light trails,
  because between blocks of reading the eye wants movement.
- Phones get the portrait cuts (flagship towers, glass strip) so the pictures
  fill the screen instead of showing a sliver.

## The founder's voice

When `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` are set on Railway, the
server reads `founderMessage` from the manifesto in the cloned voice and serves
it at `/api/founder-message.mp3`; the player on screen 7 appears by itself. To
use a real recording instead, replace the text with what you said and the
voice will match it; or drop an `mp3` in `client/public/founder-message.mp3`
and point the player at it.

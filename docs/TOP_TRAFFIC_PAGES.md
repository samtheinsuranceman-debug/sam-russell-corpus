# Where the traffic will go, and what the avatar should say there

For the HeyGen avatar next to the microphone: the pages that will carry eighty
to ninety percent of physician traffic, what is on each one, and the one
sentence the avatar opens with. Ranked from the site's own structure: a
physician arrives on the homepage, talks to the advisor, and is offered ten
URLs; the advisor answers, then asks permission to ask the questions they
should be asking in fifteen or twenty years.

There is no traffic data yet (Google Analytics and Search Console are not
switched on; see `docs/API_KEYS_WHERE_TO_GET_THEM.md`). These are the pages
the design funnels people to. Once GA4 is live, `/portal/site-health` shows
the real per-route numbers and this list should be re-cut against them.

## The ten URLs the advisor offers, in the order it should offer them

| # | URL | What is on the page | Expected share | Avatar opening line |
|---|-----|---------------------|----------------|---------------------|
| 1 | `/` | The nine screens: sign, horizon and slogan, six declarations, skyway, the fifteen patent-pending claims, expressway, what to expect and the founder's voice, sign at night, the lead card. | 45–55% of all sessions start here | "You are looking at fifteen technologies that exist only here. Ask me about any one of them, or tell me your situation and I will tell you which three matter to you first." |
| 2 | `/fact-finder` | Nine questions in the physician's own words; answers stay in the browser and become the profile the advisor and every calculator personalise from. | 12–18% | "Ten minutes here and every answer I give you for the rest of your life on this site is about you, not a template." |
| 3 | `/ultra-calculator` | The Decade Machine: one household entered once, strategy modules toggled, chained 5/10/20/30-year windows, every window starting from the last one's ending numbers. | 10–15% | "This is every calculator we own running as one machine. Change one number and watch the next thirty years move." |
| 4 | `/calculators` | The catalogue of 67 calculators by category: retirement and income, tax and estate, IUL and insurance, real estate, life events. | 6–10% | "Sixty-seven calculators, and every one of them shares data with the others. Pick the question you have today; the rest follow." |
| 5 | `/#claims` (the fifteen) | The claims section of the homepage, linked directly. | counted in 1 | "Read them top to bottom. Each one makes the next possible." |
| 6 | `/pricing` | Plans, the feature comparison, the non-refundable policy, FAQ. | 4–7% | "Before you look at the price, ask me what one of these engines would have been worth to you last year." |
| 7 | `/portal/dashboard` (after sign-in) | The physician's own dashboard: saved plans, scenarios, the ledger, the journey. | 5–8% of sessions, most of the returning ones | "Welcome back. Three things changed since you were here; ask me which one matters." |
| 8 | `/portal/ai-advisor` (after sign-in) | The full advisor with the saved profile, all six answer modes, the twenty-year questions, the PDF by email. | 3–5% | "Ask me anything. Direct, deeper, integrated, what is in it for you, or the law with citations." |
| 9 | `/support` | Getting started, the strategy engine, team management, contact. | 1–3% | "If something is not doing what you expected, tell me and I will either fix it or explain it." |
| 10 | `/privacy` and `/terms` | The legal pages. | 1–2% | No avatar. |

Everything else on the site (calculator sub-pages, the journey rooms, the
executive entrance, shared projections, video pages) shares the remaining
five to ten percent, and none of it needs an avatar of its own: the
microphone is on every page and the advisor already knows which page it is on.

## Where the avatar goes

One avatar, next to the microphone, on every page, with a page-aware opening
line from the table above. Not ten avatars. The `HEYGEN_API_KEY` variable
already exists for video proposals; the same key drives an interactive
avatar. Record the ten opening lines once in your voice, or let ElevenLabs
read them in the cloned voice (`ELEVENLABS_VOICE_ID`), and the avatar lip-syncs
whichever is played. The founder message on the homepage
(`/api/founder-message.mp3`) is the same voice, so the site sounds like one
person from the first screen to the last.

## The permission flow, as built

After any answer, the advisor now shows:

> If you are willing to take two to five more minutes, I can ask for a
> little about you that I do not have, then tell you the three to five
> questions you should be asking in fifteen or twenty years, when it would
> be too late, and answer them now.

Tapping **Yes, ask me** opens five short fields (age; years until you would
like to stop practising; largest debt and its rate; employed, partner or
owner; the money worry that is loudest). **Show me the questions** sends
those facts with the saved profile in the new answer mode, "The next twenty
years": three to five numbered questions, each answered in two to four
sentences with what to do in the next twelve months, closing with an
invitation to the Fact Finder and the standing education line. The person
can decline with **Not now** and nothing is stored.

The wording never says the system is smarter than the physician. It says the
system sees further ahead than any single advisor does, which is true and is
what they are paying for.

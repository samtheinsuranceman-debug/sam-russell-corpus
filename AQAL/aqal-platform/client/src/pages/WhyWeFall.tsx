// ============================================================
// WHY WE FALL — /why-we-fall — the long-form cultural essay
// behind the Myth Museum: why America, specifically, keeps
// buying therapies that don't work. Mechanisms that are
// research-established are cited; cultural interpretation is
// LABELED as interpretation; speculation is LABELED speculation.
// ============================================================
import { Link } from "wouter";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import PageVideo from "@/components/PageVideo";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";
const EMBER = "#E2604A";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ ...serif, fontSize: "clamp(22px,3.2vw,30px)", color: CREAM, margin: "36px 0 10px" }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: "15px", lineHeight: 1.8, color: CREAM2, margin: "0 0 14px" }}>{children}</p>;
}
function Tag({ children, color = JADE }: { children: React.ReactNode; color?: string }) {
  return <span style={{ ...mono, fontSize: "9px", letterSpacing: "0.14em", textTransform: "uppercase", padding: "3px 8px", borderRadius: "999px", color, border: `1px solid ${color}55`, marginRight: "8px" }}>{children}</span>;
}

export default function WhyWeFall() {
  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[720px] mx-auto px-6 py-16">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          The Myth Museum · the essay · <Link href="/myths" style={{ color: CHAMPAGNE }}>the collection</Link>
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(32px,5.5vw,52px)", lineHeight: 1.05, color: CREAM, margin: "0 0 14px" }}>
          Why we fall for it.
        </h1>
        <PageVideo label="why we fall for it" />
        <P>
          The Museum holds phrenology heads and $200 grounding sheets, insulin comas and manifestation journals — two
          centuries of therapies that failed their tests and thrived anyway. The interesting question isn't why sellers
          sell. It's why buyers — intelligent, educated, often scientifically literate buyers — keep buying. Some of the
          answer is universal psychology, well measured. Some of it is specifically American culture, and there we are
          interpreting, not measuring. We label which is which as we go, because that's the house rule.
        </P>

        <H2>The machinery everyone runs (measured)</H2>
        <P>
          <Tag>ESTABLISHED</Tag>Four mechanisms explain most of the Museum, and none of them require stupidity.
          <b style={{ color: CREAM }}> Regression to the mean:</b> people seek treatment at their worst, and their worst
          naturally improves — whatever they happened to be holding gets the credit. <b style={{ color: CREAM }}>Placebo
          and its theater:</b> from Franklin's 1784 mesmerism commission to modern trials, ritual, attention, and
          expectation produce real felt improvement — real enough to fund empires while proving nothing about mechanism.
          <b style={{ color: CREAM }}> The Barnum effect:</b> Forer showed in 1949 that people rate universal
          descriptions as uncannily personal, the engine inside every chart, type, and reading.
          <b style={{ color: CREAM }}> Ideomotor movement:</b> expectations move muscles without awareness — the arm in
          muscle testing, the hand in facilitated communication, the pendulum, the rods. Nobody is lying; everybody is moving.
        </P>
        <P>
          <Tag>ESTABLISHED</Tag>Add the testimonial asymmetry: a recovered neighbor is vivid; a base rate is homework.
          Secretin built an industry from one televised child and lost to fourteen quiet trials — the anecdote had a
          face, and the data never does.
        </P>

        <H2>The American amplifiers (interpretation)</H2>
        <P>
          <Tag color={CHAMPAGNE}>INTERPRETATION</Tag>Every culture has folk healing. America industrialized it, and our
          reading is that four national traits did the industrializing. <b style={{ color: CREAM }}>First, optimism as
          creed.</b> The New Thought movement of the 1800s — through Peale's positive thinking to The Secret — planted a
          durable article of faith: belief itself is causal. In that soil, "your thoughts create your reality" isn't a
          claim to test; it's a birthright to reclaim. <b style={{ color: CREAM }}>Second, self-reliance.</b> The
          frontier story says you fix yourself, alone, with what's in the wagon. A therapy you buy and self-administer
          honors the story; an institution you submit to offends it — which is partly why the supplement aisle out-sells
          the clinic.
        </P>
        <P>
          <Tag color={CHAMPAGNE}>INTERPRETATION</Tag><b style={{ color: CREAM }}>Third, the market as truth-machine.</b>
          Americans extend deep trust to things that sell: popularity reads as validation, testimonials as data, a
          bestseller as a body of evidence. Regulation of health claims is thin by design, and an entire wellness
          economy — estimated in the trillions globally — lives in the gap between "this statement has not been
          evaluated" and the checkout button. <b style={{ color: CREAM }}>Fourth, earned distrust.</b> Real betrayals —
          Tuskegee, opioid marketing, insurance labyrinths — built a reservoir of medical suspicion. Every alternative
          seller drinks from it: "what your doctor won't tell you" lands because sometimes doctors, or the systems
          around them, didn't.
        </P>
        <P>
          <Tag color={EMBER}>SPECULATION</Tag>We'll go one step further, on our own authority and clearly flagged: we
          suspect America's deepest vulnerability is that it treats suffering as a solvable engineering problem with a
          purchasable part. A culture that believes every problem ships with a product will always, always find sellers
          of parts that don't exist — because admitting some suffering requires slow, unglamorous, measured work is the
          one product story America has never much wanted to buy. The Museum, on this reading, isn't a hall of fraud.
          It's a mirror of a nation's beautiful, dangerous impatience with the long way.
        </P>

        <H2>The tell, every time</H2>
        <P>
          <Tag>ESTABLISHED</Tag>Across two centuries the failed therapies share a signature, and it's checkable: they
          resist blinded testing, they explain away nulls ("your skepticism blocked the energy"), their claimed effects
          exceed their strongest study, and their mechanism is either undetectable or borrowed from physics that doesn't
          say what they need it to say. Real interventions run toward tests. The Museum's exhibits ran from them, every
          single one, and that — not weirdness, not newness — is what earned them a plinth.
        </P>

        <H2>What this platform owes you because of it</H2>
        <P>
          We sell measurement in a marketplace with this exact history, which is why the rules here are structural:
          claims carry citations, correlations carry error bars, corrections are public and append-only, estimates are
          labeled estimates, and this essay labels its own speculation. The honest version of the industry we're in is
          the entire product. <Link href="/corrections" style={{ color: CHAMPAGNE }}>Challenge anything</Link> — the
          exhibits, the essay, our own claims. That invitation is the difference between a museum and a church.
        </P>

        <div className="rounded-2xl p-7 mt-10 text-center" style={{ border: `1px solid ${CHAMPAGNE}44`, background: "rgba(224,198,140,0.05)" }}>
          <p style={{ ...serif, fontSize: "clamp(20px,3vw,26px)", color: CREAM, margin: "0 0 6px" }}>
            The long way, if you want it.
          </p>
          <p style={{ fontSize: "14px", lineHeight: 1.65, color: CREAM2, margin: "0 0 16px" }}>
            32 lines, spoken evidence, eight independent scorers, public corrections. No shortcuts were harmed in the
            making of this assessment.
          </p>
          <Link href="/assessment" className="inline-block rounded-lg"
            style={{ ...mono, fontSize: "12px", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700, padding: "15px 28px", background: CHAMPAGNE, color: INK }}>
            Measure all 32 lines
          </Link>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}

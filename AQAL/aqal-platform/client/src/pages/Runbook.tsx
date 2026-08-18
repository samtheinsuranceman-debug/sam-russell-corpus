// ============================================================
// THE OWNER'S RUNBOOK — /runbook
// One page, non-technical, for Sam. What to glance at daily,
// what to do when each thing breaks, and who does what.
// Contains no secrets: keys live only in the deployment
// environment, and every admin number is behind admin access.
// ============================================================
import { Link } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const JADE = "#8FBC9F";
const EMBER = "#D08B6C";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

type Play = { title: string; when: string; steps: string[] };

const PLAYS: Play[] = [
  {
    title: "Voice recording or transcription isn't working",
    when: "A member says the mic won't record, or answers come back as gibberish/placeholder text.",
    steps: [
      "First, rule out the member's browser: the /help page's first answer covers mic permissions — send them there.",
      "If it's everyone, not one person: open /launch-check and look at the STT row. \"mock\" means the speech-to-text key is missing from the deployment environment — that's a Manus fix (set the key, redeploy), not a code bug.",
      "Members are never stuck: they can upload a voice-memo file or a typed .txt transcript instead — all routes score identically.",
    ],
  },
  {
    title: "Emails aren't arriving (verification, password reset, support)",
    when: "Members say they never got the link, or you stop receiving support messages.",
    steps: [
      "Check /launch-check → the email row. \"mock\" means RESEND_API_KEY is missing from the environment — emails are only being logged, not sent. Manus sets the key.",
      "If the key is set but mail lands in spam: the domain's SPF/DKIM/DMARC DNS records need to be completed (Manus task, one-time).",
      "Password reset and verification links expire in 1 hour — a member with an old link should just request a fresh one.",
    ],
  },
  {
    title: "The AI panel is down or scoring is stuck",
    when: "A member finished all 27 answers over an hour ago and still sees the deliberation screen.",
    steps: [
      "Open /launch-check → \"Panel: live\" shows how many of the 8 labs are responding. Fewer than 8 usually means one provider's key expired or their service is down.",
      "The keySource column names which environment variable each lab reads — tell Manus which one to check or rotate.",
      "Scoring tolerates missing labs; total failure (0 live) means keys were never set in this deployment.",
    ],
  },
  {
    title: "The whole site is down",
    when: "joinaqal.com won't load at all.",
    steps: [
      "This layer is entirely Manus's: hosting, domain, and deploys live in the Manus project. Message Manus: \"site down, restart the deployment.\"",
      "After it's back, open /launch-check and run the full check before announcing anything.",
    ],
  },
  {
    title: "Deploying an update",
    when: "Claude hands you a zip (full bundle or small patch).",
    steps: [
      "Give the zip to Manus with its APPLY_INSTRUCTIONS — the instructions always include the check that proves he's applying it to the right base.",
      "Manus's order is always: backup the database → apply files → pnpm db:push (only when the instructions say the database changed) → build → deploy.",
      "Afterward, Manus screenshots /launch-check back to you. All green (or explained) = done. Never accept \"deployed\" without the screenshot.",
    ],
  },
  {
    title: "Money: the AI spend alarm",
    when: "You want to know the platform can't silently run up an AI bill.",
    steps: [
      "Every panel call is metered. If the LLM_DAILY_BUDGET_USD environment variable is set (e.g. 25), you get ONE email the first time a day's spend crosses it.",
      "Current totals are on /launch-check (budget-guard row) and in the admin cost summary. If the alarm fires repeatedly, ask Claude to review what's driving usage before raising the number.",
    ],
  },
  {
    title: "A member emails a crisis or the crisis queue flags someone",
    when: "The admin crisis queue shows a new flag, or a support message reads as a person in danger.",
    steps: [
      "Flags come from a deterministic word list on assessments, goals, pulse checks, and Black Box entries — never private messages. The member has already been shown crisis resources (988 Suicide & Crisis Lifeline; Crisis Text Line: text HOME to 741741) in the moment.",
      "Review the flag in the admin panel and mark it reviewed. You are not a clinician and the platform never claims to be — the resources do that job; your job is making sure the flag wasn't a system miss.",
    ],
  },
  {
    title: "Rotating a leaked or expired API key",
    when: "A key was pasted somewhere public, or a provider disabled one.",
    steps: [
      "Rule one: keys live ONLY in the Manus deployment environment. Never in chat, never in the code, never in a zip.",
      "Generate the new key at the provider's console, give it to Manus to set as the environment variable, then have Manus restart. /launch-check confirms the lab is live again.",
      "If the old key was exposed anywhere, revoke it at the provider — rotation without revocation fixes nothing.",
    ],
  },
  {
    title: "Backups and the restore drill",
    when: "Before every schema-changing deploy, and once a month regardless.",
    steps: [
      "Manus owns backups. The standing order: automatic daily database backups, and a monthly RESTORE DRILL — actually restoring one backup to a scratch database and checking a member's data is intact.",
      "A backup that has never been restored is a hope, not a backup. Ask for the drill result monthly.",
    ],
  },
];

export default function Runbook() {
  const { user, loading } = useAuth();
  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[820px] mx-auto px-6 py-16">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          The Owner's Runbook
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,46px)", color: CREAM, margin: "0 0 10px" }}>
          When it breaks, do this.
        </h1>
        <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.7, marginBottom: "6px" }}>
          One page, no jargon. The division of labor behind it:{" "}
          <b style={{ color: CREAM }}>Claude writes and merges the code</b> and hands over zips with instructions;{" "}
          <b style={{ color: CREAM }}>Manus owns the live deployment</b> — hosting, database, environment keys, DNS,
          backups. When something breaks, this page tells you which of the two to point at.
        </p>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, marginBottom: "26px" }}>
          Daily glance: <Link href="/launch-check" style={{ color: CHAMPAGNE }}>/launch-check</Link> (all green?) ·
          support inbox (anything from members?) · admin crisis queue (any new flags?)
        </p>

        {!loading && !user && (
          <div className="rounded-xl border p-4 mb-6" style={{ borderColor: `${EMBER}55`, background: "rgba(208,139,108,0.06)" }}>
            <p style={{ ...mono, fontSize: "11px", color: EMBER, margin: 0 }}>
              Sign in to use the admin links referenced below — the runbook itself contains no secrets.
            </p>
          </div>
        )}

        <div className="space-y-3">
          {PLAYS.map((p, i) => (
            <div key={i} className="rounded-xl border p-5" style={{ borderColor: LINE_C, background: "rgba(241,234,219,0.02)" }}>
              <p style={{ ...serif, fontSize: "19px", color: CREAM, margin: "0 0 4px" }}>{p.title}</p>
              <p style={{ ...mono, fontSize: "10.5px", color: MUTED, margin: "0 0 10px" }}>{p.when}</p>
              <ol style={{ margin: 0, paddingLeft: "18px" }}>
                {p.steps.map((s, j) => (
                  <li key={j} style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, marginBottom: "6px" }}>{s}</li>
                ))}
              </ol>
            </div>
          ))}
        </div>

        <div className="rounded-xl border p-5 mt-8" style={{ borderColor: `${JADE}44`, background: "rgba(143,188,159,0.05)" }}>
          <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.2em", textTransform: "uppercase", color: JADE, marginBottom: "8px" }}>
            The one rule that prevents most disasters
          </p>
          <p style={{ fontSize: "13.5px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>
            No deploy without a database backup first, and no "it's deployed" without a green /launch-check screenshot
            after. Everything else on this page is recoverable if those two habits hold.
          </p>
        </div>
      </div>
      <PublicFooter />
    </div>
  );
}

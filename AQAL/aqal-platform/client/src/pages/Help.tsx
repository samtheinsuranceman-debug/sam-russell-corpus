// ============================================================
// HELP / FAQ — the five predictable frictions, answered before
// they become support messages. The support box handles the rest.
// ============================================================
import { Link } from "wouter";
import { useState } from "react";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const INK = "#141009";
const CREAM = "#F1EADB";
const CREAM2 = "#CFC5B0";
const MUTED = "#9C8F79";
const CHAMPAGNE = "#E0C68C";
const LINE_C = "rgba(241,234,219,0.12)";
const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const FAQS: { q: string; a: string }[] = [
  { q: "The microphone isn't working / the browser won't record",
    a: "When you press record, your browser asks for microphone permission — that popup is us; allow it. If you dismissed it once, look for the mic icon in your address bar (desktop) or Settings → Safari/Chrome → Microphone (phone) and set joinaqal.com to Allow. Recording works in Chrome, Firefox, Safari 14.5+, and Edge. If nothing works, you never need the mic: record on any voice-memo app and upload the file, or upload a typed/.txt transcript instead — all three routes score identically." },
  { q: "My upload is stuck or failed",
    a: "Audio files up to about 35 MB work; longer recordings are better split per question. If an upload hangs: check your connection, refresh, and try again — answers save per question, so nothing already submitted is ever lost. Text transcripts (.txt) upload almost instantly and can contain multiple questions in any order; the system detects question markers like 'Question 3' and splits them automatically." },
  { q: "I can't sign in / I forgot my password",
    a: "Your username is the email you claimed with. If the password won't take, use 'Forgot your password?' on the sign-in card — a one-hour reset link goes to your email (check spam the first time). If you never confirmed your email, do that first from the banner in your portal: password recovery depends on a verified address." },
  { q: "Where is my report? / How long does scoring take?",
    a: "Scoring starts when your 27th answer lands. The eight-model panel usually finishes in minutes — you'll see the deliberation screen while it runs, and the report replaces it automatically. If it's been more than an hour, something's wrong on our side: tell us through the Support button and we'll chase it." },
  { q: "Payments, the free founding spots, and the trial",
    a: "The first 10,000 founding members get the assessment and membership free for life — no card, ever. A signup reserves your spot for 14 days; completing the assessment claims it permanently. After the founding cohort, membership is $449/month or $4,499/year with a free trial, and premium assessments run $500–$1,500. Billing questions: the Support button reaches Sam directly." },
  { q: "Is my data private?",
    a: "Your answers are yours: staff never read private messages (only content you report), message attachments wipe within 72 hours, Black Box entries can be marked private and excluded from coaching, and you can request a full export or deletion any time. Crisis-safety scanning is deterministic (a word list, not an AI reading your life) and only runs on assessments, goals, and Black Box text — never messages." },
];

export default function Help() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="min-h-screen" style={{ background: INK }}>
      <PublicHeader />
      <div className="max-w-[760px] mx-auto px-6 py-16">
        <p style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "12px" }}>
          Help · answers first, humans right behind
        </p>
        <h1 style={{ ...serif, fontSize: "clamp(30px,5vw,46px)", color: CREAM, margin: "0 0 10px" }}>
          Stuck? Start here.
        </h1>
        <p style={{ color: CREAM2, fontSize: "14.5px", lineHeight: 1.65, marginBottom: "28px" }}>
          The six things that trip people up, solved. Anything else — the{" "}
          <b style={{ color: CHAMPAGNE }}>? Support</b> button (bottom-left of every page) goes straight to Sam, not a
          ticket queue.
        </p>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <div key={i} className="rounded-xl border cursor-pointer" style={{ borderColor: open === i ? `${CHAMPAGNE}55` : LINE_C, background: open === i ? "rgba(224,198,140,0.04)" : "transparent" }}
              onClick={() => setOpen(open === i ? null : i)}>
              <div className="flex items-baseline justify-between gap-3 px-5 py-4">
                <span style={{ ...serif, fontSize: "18px", color: CREAM }}>{f.q}</span>
                <span style={{ ...mono, color: MUTED }}>{open === i ? "−" : "+"}</span>
              </div>
              {open === i && <p className="px-5 pb-5" style={{ fontSize: "14px", lineHeight: 1.7, color: CREAM2, margin: 0 }}>{f.a}</p>}
            </div>
          ))}
        </div>
        <p style={{ ...mono, fontSize: "10.5px", color: MUTED, marginTop: "24px" }}>
          Also useful: <Link href="/sample-report"><a style={{ color: CHAMPAGNE }}>see a sample report</a></Link> ·{" "}
          <Link href="/lines"><a style={{ color: CHAMPAGNE }}>the 32 lines defined</a></Link> ·{" "}
          <Link href="/reset-password"><a style={{ color: CHAMPAGNE }}>reset your password</a></Link>
        </p>
      </div>
      <PublicFooter />
    </div>
  );
}

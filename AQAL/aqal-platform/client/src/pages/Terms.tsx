import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <PublicHeader />

      <main className="pt-32 pb-20 px-4">
        <div className="container max-w-3xl mx-auto">
          <p
            className="text-xs uppercase tracking-[0.25em] text-accent/60 mb-4"
            style={{ fontFamily: "'JetBrains Mono', monospace" }}
          >
            Legal
          </p>
          <h1
            className="text-4xl sm:text-5xl text-foreground mb-4"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 300 }}
          >
            Terms of Service
          </h1>
          <p className="text-muted-foreground mb-12">
            Last updated: June 29, 2026
          </p>

          <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground/90 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
              <p>
                By accessing or using the AQAL Intelligence Platform ("Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. The Service is operated by AQAL Intelligence ("we," "us," or "our").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. Description of Service</h2>
              <p>
                AQAL Intelligence provides a voice-based cognitive assessment platform that analyzes spoken responses across 32 intelligence dimensions using multiple AI systems. The Service generates intelligence profiles, rarity scores, and complementary matching recommendations.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Eligibility</h2>
              <p>
                You must be at least 18 years old to use this Service. By using the Service, you represent and warrant that you meet this age requirement and have the legal capacity to enter into these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Account Registration</h2>
              <p>
                To access certain features, you must create an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Voice Data and Assessment</h2>
              <p>
                When you complete an assessment, your voice recordings are processed by our AI systems to generate scores. Voice recordings are processed in real-time and are not permanently stored after analysis is complete. Only the resulting numerical scores and text transcriptions are retained in association with your account.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Intellectual Property</h2>
              <p>
                The AQAL assessment methodology, scoring algorithms, 22-axis framework, and all associated intellectual property are owned by AQAL Intelligence. Your assessment results belong to you, but the underlying methodology and system remain our proprietary property. Seven patents are pending on the core technology.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Membership and Payments</h2>
              <p>
                Certain features require a paid membership. Pricing, features, and terms for each tier are described on our Pricing page. All payments are processed through Stripe. Refunds are available within 30 days of purchase if you have not completed a full assessment ("30-Day Retake Guarantee").
              </p>
              <p className="mt-3">
                <strong>Free and Founding access.</strong> The core assessment, your intelligence profile, and network membership are provided at no cost and will not be charged to free or founding members. Ongoing services — including monthly re-measurement, AI coaching, progress tracking, goals-engineering navigation, active matching, and group sessions — constitute a separate paid membership. AQAL may introduce or modify paid tiers, pricing, and features from time to time; material changes are announced in advance and do not revoke the complimentary core access described here. Founding-member benefits (including any locked-in founding rate) apply as described at the time of enrollment.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Acceptable Use</h2>
              <p>
                You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to reverse-engineer the scoring algorithms; (c) share or sell assessment results in a way that misrepresents the Service; (d) create multiple accounts to manipulate scores or rankings; (e) use automated tools to interact with the Service without authorization.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8A. Member-to-Member Communications</h2>
              <p className="mb-3">
                <strong>Confidentiality.</strong> All messages, files, images, documents, voice notes, and other content
                shared between members through the AQAL messaging system ("Member Content") is treated as strictly
                confidential. AQAL Intelligence, its employees, contractors, and affiliates do not open, read, view,
                analyze, monitor, or access Member Content, except: (a) when required by valid legal process; (b) when a
                member reports abuse or harassment through the official reporting mechanism; or (c) automated malware
                scanning of uploaded files, which is never human-reviewed.
              </p>
              <p className="mb-3">
                <strong>Automatic deletion.</strong> All file attachments (images, documents, voice notes, videos) are
                automatically and permanently deleted from AQAL servers 72 hours after upload — no backup, no archive,
                no recovery. Text messages are retained for the duration of your active membership and permanently
                deleted within 30 days of account cancellation. Members acknowledge that shared files are ephemeral and
                should save anything important locally before the 72-hour window expires.
              </p>
              <p className="mb-3">
                <strong>Assessment voice recordings.</strong> The raw audio of your spoken assessment answers exists
                only to be transcribed and scored. Beginning 72 hours after your assessment completes, the audio files
                themselves are permanently deleted from storage — your voice is not retained. The written transcript
                is retained: it is the scored record your report, coaching, and any future re-scoring are built on,
                and it is included in your data export and covered by your deletion rights (Section 8C).
              </p>
              <p className="mb-3">
                <strong>Encryption and no sale of data.</strong> Member Content is encrypted in transit and at rest.
                AQAL does not sell, license, share, or monetize Member Content or communication metadata (who messaged
                whom, when, or how often) to any third party for any purpose.
              </p>
              <p>
                <strong>Member responsibility and fair use.</strong> Messaging is available only between members who
                have mutually accepted a connection. To keep the deletion cycle reliable for everyone, file sharing is
                limited to 250 MB and 50 files per member in any rolling 48-hour period. You are responsible for the
                content you share; sharing illegal content, harassment, or spam results in immediate account
                termination.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Disclaimer</h2>
              <p>
                The AQAL Intelligence assessment is designed for personal insight and development purposes. It is not a clinical diagnostic tool and should not be used as a substitute for professional psychological evaluation. Results are generated by AI systems and represent statistical patterns, not definitive measures of ability.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. Limitation of Liability</h2>
              <p>
                To the maximum extent permitted by law, AQAL Intelligence shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service. Our total liability shall not exceed the amount you paid for the Service in the twelve months preceding the claim.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Changes to Terms</h2>
              <p>
                We reserve the right to modify these Terms at any time. Material changes will be communicated via email or in-app notification at least 30 days before taking effect. Continued use of the Service after changes constitutes acceptance of the modified Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8B. Assessment Content, the Black Box &amp; Safety Scanning</h2>
              <p className="mb-3">
                <strong>Your narratives are yours.</strong> Assessment answers, goal notes, belief records, and Black Box
                (crash forensics) entries are member content. Black Box entries marked "private" are excluded from all
                coaching, synthesis, and algorithmic use — they exist for your reflection alone. Staff do not read this
                content; it is processed only by the automated scoring systems that produce your results.
              </p>
              <p className="mb-3">
                <strong>Safety scanning, disclosed.</strong> Assessment answers, goal notes, and Black Box entries are
                checked by a deterministic word-list scanner (never an AI interpreting your life) solely to surface
                crisis-support resources to you. This scanner never runs on member-to-member messages, and its results
                are never used for marketing, scoring penalties, or disclosure to third parties.
              </p>
              <p className="mb-3">
                <strong>Crashes annotate; they never penalize.</strong> Black Box content is used to identify patterns
                and prescribe safeguards. It is never used to lower any intelligence-line score.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8C. Founding Access &amp; Data Rights</h2>
              <p className="mb-3">
                <strong>Free for life, in writing.</strong> For founding members (the first 10,000 who complete the
                assessment), the complimentary core access described in these Terms is lifetime. It will not be revoked,
                converted to a paid requirement, or materially degraded for the life of the Service.
              </p>
              <p className="mb-3">
                <strong>Export and deletion, self-serve.</strong> Every member — regardless of jurisdiction — may export
                a complete copy of their own data (profile, assessment answers, scores, goals, beliefs, and Black Box
                entries) from their Profile page at any time, and may request full account deletion from the same page.
                Deletion requests are processed within 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Contact</h2>
              <p>
                For questions about these Terms, contact us at legal@aqalintelligence.com.
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

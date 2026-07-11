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
              <p className="mt-3">
                <strong className="text-foreground">Evidence uploads.</strong> Any evidence you upload to verify your scores is reviewed one time, validated, and used solely to record your result and what it means. The moment that measurement is recorded, the uploaded file is permanently and irreversibly deleted from our servers and all backups. We retain the conclusion, never the uploaded evidence itself.
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
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Acceptable Use</h2>
              <p>
                You agree not to: (a) use the Service for any unlawful purpose; (b) attempt to reverse-engineer the scoring algorithms; (c) share or sell assessment results in a way that misrepresents the Service; (d) create multiple accounts to manipulate scores or rankings; (e) use automated tools to interact with the Service without authorization.
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

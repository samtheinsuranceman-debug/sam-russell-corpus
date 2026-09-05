import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

export default function Privacy() {
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
            Privacy Policy
          </h1>
          <p className="text-muted-foreground mb-12">
            Last updated: June 29, 2026
          </p>

          <div className="prose prose-invert max-w-none space-y-8 text-muted-foreground/90 leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">1. Information We Collect</h2>
              <p className="mb-3">
                <strong className="text-foreground">Account Information:</strong> When you create an account, we collect your name, email address, and profile picture through our OAuth authentication provider.
              </p>
              <p className="mb-3">
                <strong className="text-foreground">Voice Recordings:</strong> During assessments, we temporarily process your voice recordings. These recordings are analyzed in real-time by our AI systems and are not permanently stored. Only the extracted scores and text transcriptions are retained.
              </p>
              <p className="mb-3">
                <strong className="text-foreground">Assessment Data:</strong> We store your 32-line intelligence scores, composite rarity calculations, and assessment metadata (timestamps, completion status).
              </p>
              <p>
                <strong className="text-foreground">Usage Data:</strong> We collect anonymized usage analytics including page views, feature engagement, and session duration to improve the Service.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">2. How We Use Your Information</h2>
              <p>
                We use your information to: (a) provide and improve the assessment service; (b) generate your intelligence profile and rarity score; (c) facilitate complementary matching with other users (only with your explicit consent); (d) communicate service updates and relevant information; (e) ensure platform security and prevent abuse.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">3. Voice Data Processing</h2>
              <p>
                Your voice data receives special protection under our privacy framework:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li>Voice recordings are processed in real-time and discarded after analysis</li>
                <li>We do not use your voice data to train AI models</li>
                <li>Only numerical scores and text transcriptions are retained</li>
                <li>Multiple AI systems from different developers analyze your responses — no single system has access to your complete profile</li>
                <li>All voice processing occurs on encrypted channels</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">4. Data Sharing</h2>
              <p>
                We do not sell your personal data. We share information only in these limited circumstances:
              </p>
              <ul className="list-disc pl-6 mt-3 space-y-2">
                <li><strong className="text-foreground">Complementary Matching:</strong> If you opt in, anonymized score profiles may be compared with other users to suggest complementary partnerships. Your identity is never revealed without your explicit consent.</li>
                <li><strong className="text-foreground">Service Providers:</strong> We use Stripe for payment processing and secure cloud infrastructure for data storage. These providers are bound by strict data processing agreements.</li>
                <li><strong className="text-foreground">Legal Requirements:</strong> We may disclose information when required by law or to protect our rights and the safety of our users.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">5. Data Security</h2>
              <p>
                We implement industry-standard security measures including: end-to-end encryption for all data in transit; AES-256 encryption for data at rest; regular security audits; access controls with principle of least privilege; and SOC 2 Type II compliance (in progress).
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">6. Data Retention</h2>
              <p>
                Assessment scores and profile data are retained for as long as your account is active. You may request deletion of your account and all associated data at any time. Upon deletion, all personal data is permanently removed within 30 days, except where retention is required by law.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">7. Your Rights</h2>
              <p>
                Depending on your jurisdiction, you may have the right to: access your personal data; correct inaccurate data; delete your data; port your data to another service; object to certain processing; and withdraw consent at any time. To exercise these rights, contact privacy@aqalintelligence.com.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">8. Cookies and Tracking</h2>
              <p>
                We use essential cookies for authentication and session management. We use privacy-respecting analytics (no third-party tracking pixels, no advertising cookies). You can control cookie preferences through your browser settings.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">9. Children's Privacy</h2>
              <p>
                The Service is not intended for users under 18 years of age. We do not knowingly collect personal information from children. If we become aware that a child has provided us with personal data, we will take steps to delete that information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">10. International Transfers</h2>
              <p>
                Your data may be processed in the United States. We ensure appropriate safeguards are in place for international data transfers, including standard contractual clauses where applicable.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">11. Changes to This Policy</h2>
              <p>
                We will notify you of material changes to this Privacy Policy at least 30 days before they take effect. The "Last updated" date at the top reflects the most recent revision.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-foreground mb-3">12. Contact</h2>
              <p>
                For privacy-related inquiries: privacy@aqalintelligence.com
              </p>
            </section>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

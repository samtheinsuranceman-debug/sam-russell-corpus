import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import PageBackdrop from "@/components/PageBackdrop";

const PHOTOS = {
  river: { src: "/rcs-city-river.webp", phoneSrc: "/rcs-city-spire.webp", alt: "Emerald-lit skyline at dusk with a river curving through the city" },
  harbor: { src: "/rcs-city-harbor.webp", phoneSrc: "/rcs-city-towers.webp", alt: "Green-lit harbour city at night, towers reflected in the water" },
  emerald: { src: "/rcs-city-emerald.webp", phoneSrc: "/rcs-city-spire.webp", alt: "Emerald-lit city skyline at dawn with a river winding through it" },
} as const;

function LegalShell({ title, photo, position, children }: { title: string; photo: keyof typeof PHOTOS; position?: string; children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen bg-[#060f20] text-[#c8d8ec]">
      <PageBackdrop {...PHOTOS[photo]} fade="#060f20" position={position} />
      <div className="container relative z-10 max-w-3xl py-12">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#7a95b8] hover:text-white mb-8 transition-colors">
          <ArrowLeft size={14} /> Back to Home
        </Link>
        <h1 className="text-3xl font-extrabold text-white mb-8" style={{ fontFamily: "DM Sans, sans-serif" }}>{title}</h1>
        <div className="prose prose-invert max-w-none text-[#c8d8ec] space-y-6 text-sm leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}

export function Privacy() {
  return (
    <LegalShell title="Privacy Policy" photo="harbor" position="center 20%">
      <p><strong className="text-white">Effective Date:</strong> January 1, 2026</p>
      <p>Russell Capital Systems™ ("we", "our", "us") operates the Russell Capital Systems™ Wealth OS platform. www.RussellCapitalSystems.com is owned and operated by Russell Holdings Management LLC. This Privacy Policy explains how we collect, use, and protect your information.</p>
      <h2 className="text-white font-bold text-lg">Information We Collect</h2>
      <p>We collect information you provide when creating an account, including your name, email address, and professional credentials. We also collect usage data, session logs, and financial modeling inputs you enter into the platform.</p>
      <h2 className="text-white font-bold text-lg">How We Use Your Information</h2>
      <p>We use your information to provide and improve the platform, generate financial strategies and projections, send operational notifications, and comply with legal obligations. We do not sell your personal information to third parties.</p>
      <h2 className="text-white font-bold text-lg">Data Security</h2>
      <p>All data is encrypted in transit (TLS 1.3) and at rest (AES-256). Access is restricted to authenticated users with role-based permissions. We maintain audit logs of all data access and modifications.</p>
      <h2 className="text-white font-bold text-lg">Financial Data</h2>
      <p>Client financial data entered into the platform is used solely to generate planning scenarios. We do not share individual client data with third parties without explicit consent.</p>
      <h2 className="text-white font-bold text-lg">Contact</h2>
      <p>For privacy inquiries, contact us at <a href="mailto:privacy@russellcapitalsystems.com" className="text-[#22c55e]">privacy@russellcapitalsystems.com</a>.</p>
    </LegalShell>
  );
}

export function Terms() {
  return (
    <LegalShell title="Terms of Service" photo="emerald" position="center 70%">
      <p><strong className="text-white">Effective Date:</strong> January 1, 2026</p>
      <p>By accessing or using the Russell Capital Systems™ Wealth OS platform, you agree to these Terms of Service.</p>
      <h2 className="text-white font-bold text-lg">Platform Use</h2>
      <p>The platform is licensed for use by licensed financial professionals and their authorized team members. You are responsible for ensuring your use complies with applicable financial regulations in your jurisdiction.</p>
      <h2 className="text-white font-bold text-lg">Strategy Outputs & Projections</h2>
      <p>Strategy outputs, projections, and modeling results are provided for informational and planning purposes only. They do not constitute financial, tax, or legal advice. You are responsible for independently verifying all recommendations and projections before presenting them to clients.</p>
      <h2 className="text-white font-bold text-lg">Subscription and Billing</h2>
      <p>Subscriptions are billed monthly or annually as selected. You may cancel at any time. Refunds are provided at our discretion for annual plans cancelled within 30 days of purchase.</p>
      <h2 className="text-white font-bold text-lg">Intellectual Property</h2>
      <p>All platform software, proprietary models, and financial engines are the intellectual property of Russell Holdings Management LLC, doing business as Russell Capital Systems™. You may not reverse-engineer, copy, or redistribute any platform components.</p>
      <h2 className="text-white font-bold text-lg">Contact</h2>
      <p>For legal inquiries, contact us at <a href="mailto:legal@russellcapitalsystems.com" className="text-[#22c55e]">legal@russellcapitalsystems.com</a>.</p>
    </LegalShell>
  );
}

export function Support() {
  return (
    <LegalShell title="Support" photo="river" position="center 60%">
      <p>Our support team is available to help you get the most out of Russell Capital Systems™ Wealth OS.</p>
      <h2 className="text-white font-bold text-lg">Getting Started</h2>
      <p>After signing in, you'll land on your advisor dashboard. Use the Strategy Lab to run Roth conversion ladders and IUL projections. Add clients via the Clients section, then track deals in the Pipeline.</p>
      <h2 className="text-white font-bold text-lg">Strategy Engine</h2>
      <p>The Strategy Assist panel generates full financial strategies based on client demographics and asset data. Results are grounded in your Knowledge Library documents for compliance-aligned output.</p>
      <h2 className="text-white font-bold text-lg">Team Management</h2>
      <p>Invite team members from the Team settings page. Roles include Admin, Advisor, Analyst, and Viewer. Invitations expire after 7 days.</p>
      <h2 className="text-white font-bold text-lg">Contact Support</h2>
      <p>Email: <a href="mailto:support@russellcapitalsystems.com" className="text-[#22c55e]">support@russellcapitalsystems.com</a></p>
      <p>Response time: within 1 business day for Growth plans, same-day for Professional and Enterprise.</p>
    </LegalShell>
  );
}

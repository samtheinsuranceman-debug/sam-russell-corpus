import { useState } from "react";
import { useLocation } from "wouter";
import {
  ArrowLeft,
  Shield,
  ShieldCheck,
  Lock,
  Users,
  Heart,
  Crown,
  Baby,
  Building2,
  ChevronDown,
  ChevronUp,
  Info,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Landmark,
  Scale,
  Gem,
  Layers,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Legend,
} from "recharts";

// ─── TRUST TYPE DATA ────────────────────────────────────────────────
interface TrustType {
  id: string;
  name: string;
  fullName: string;
  icon: any;
  color: string;
  colorHex: string;
  tagline: string;
  purpose: string;
  howItWorks: string[];
  irsCodes: { code: string; title: string; relevance: string }[];
  benefits: string[];
  useCases: string[];
  fundingMethods: string[];
  keyRequirements: string[];
  typicalClient: string;
  estateExclusion: boolean;
  creditorProtection: boolean;
  spouseAccess: boolean;
  childAccess: boolean;
  multiGenerational: boolean;
  taxFreeGrowth: boolean;
  // Radar chart scores (0-10)
  scores: {
    estateProtection: number;
    creditorShield: number;
    divorceProof: number;
    taxEfficiency: number;
    flexibility: number;
    generationalWealth: number;
  };
}

const TRUST_TYPES: TrustType[] = [
  {
    id: "ilit",
    name: "ILIT",
    fullName: "Irrevocable Life Insurance Trust",
    icon: Shield,
    color: "emerald",
    colorHex: "#10b981",
    tagline: "The Fortress — Removes life insurance from your taxable estate forever",
    purpose: "Removes life insurance death benefits from the taxable estate while providing creditor protection, divorce-proofing, and controlled wealth transfer to beneficiaries. The ILIT is the cornerstone of every serious estate plan for high-net-worth individuals.",
    howItWorks: [
      "Grantor creates an irrevocable trust and names a trustee (cannot be the grantor)",
      "Trust purchases or receives ownership of a life insurance policy on the grantor's life",
      "Grantor makes annual gifts to the trust to pay premiums (using Crummey notices to qualify for §2503(b) annual exclusion)",
      "Because the trust owns the policy, the death benefit is excluded from the grantor's estate under IRC §2042",
      "At death, the trustee distributes proceeds according to trust terms — tax-free to beneficiaries under IRC §101(a)",
      "Cash value grows tax-deferred inside the trust, providing a living benefit during the grantor's lifetime",
      "The three-year rule (IRC §2035) requires the trust to be established at least 3 years before death for full exclusion",
    ],
    irsCodes: [
      { code: "IRC §2042", title: "Incidents of Ownership", relevance: "If the insured holds any incidents of ownership (right to change beneficiary, borrow against policy, etc.), the death benefit is included in the taxable estate. The ILIT eliminates this by making the trust the owner." },
      { code: "IRC §2035", title: "Three-Year Rule", relevance: "Transfers of life insurance within 3 years of death are pulled back into the estate. This is why ILITs must be established well in advance — not as a deathbed strategy." },
      { code: "IRC §2036", title: "Retained Life Estate", relevance: "If the grantor retains the right to income or use of transferred property, it's included in the estate. Properly structured ILITs ensure the grantor has zero control." },
      { code: "IRC §2503(b)", title: "Annual Gift Tax Exclusion", relevance: "Premium payments to the ILIT qualify for the $18,000/$36,000 annual exclusion through Crummey withdrawal notices to beneficiaries." },
      { code: "IRC §101(a)", title: "Death Benefit Exclusion", relevance: "Life insurance death benefits are income tax-free to beneficiaries. Combined with ILIT ownership, this creates a completely tax-free wealth transfer." },
    ],
    benefits: [
      "Death benefit excluded from taxable estate (saves 40% estate tax on proceeds)",
      "Creditor protection during grantor's lifetime",
      "Divorce-proof — trust assets are not marital property",
      "Tax-free death benefit to beneficiaries (IRC §101(a))",
      "Cash value grows tax-deferred (IRC §7702)",
      "Grantor controls distribution terms through trust language",
      "Can be structured as a Dynasty Trust for multi-generational wealth",
      "Provides estate liquidity without increasing taxable estate",
    ],
    useCases: [
      "High-net-worth individuals with estates exceeding the federal exemption ($13.61M in 2024)",
      "Business owners needing liquidity for buy-sell agreements",
      "Parents wanting to maximize tax-free inheritance for children",
      "Individuals seeking creditor and divorce protection for life insurance",
      "Estate plans requiring liquidity to pay estate taxes without selling assets",
    ],
    fundingMethods: [
      "Crummey gifts (annual exclusion gifts with withdrawal rights)",
      "Private split-dollar arrangements",
      "Private premium financing",
      "Gift of income-producing assets to trust",
      "Lifetime exemption gifts ($13.61M per person in 2024)",
    ],
    keyRequirements: [
      "Trust must be irrevocable — grantor cannot modify or revoke",
      "Grantor cannot be trustee (no incidents of ownership)",
      "Crummey notices must be sent to beneficiaries for each premium payment",
      "Must survive 3-year lookback period (IRC §2035)",
      "Independent trustee required for discretionary distributions",
    ],
    typicalClient: "Married professional, age 45-65, net worth $5M+, with children, concerned about estate taxes and asset protection",
    estateExclusion: true,
    creditorProtection: true,
    spouseAccess: false,
    childAccess: false,
    multiGenerational: false,
    taxFreeGrowth: true,
    scores: { estateProtection: 10, creditorShield: 9, divorceProof: 10, taxEfficiency: 9, flexibility: 5, generationalWealth: 7 },
  },
  {
    id: "slat",
    name: "SLAT",
    fullName: "Spousal Limited Access Trust",
    icon: Heart,
    color: "pink",
    colorHex: "#ec4899",
    tagline: "The Power Couple — Estate protection with spousal access to cash value",
    purpose: "A specialized ILIT that allows the grantor's spouse limited access to trust assets (cash value and income), while still keeping the death benefit outside the taxable estate. The best of both worlds — protection AND access.",
    howItWorks: [
      "Grantor creates an irrevocable trust naming spouse as a permissible beneficiary",
      "Trust purchases life insurance on the grantor's life",
      "Spouse can access cash value for HEMS (Health, Education, Maintenance, Support)",
      "Death benefit remains outside the grantor's taxable estate under IRC §2042",
      "Spouse can take income distributions OR maintain the full death benefit",
      "If spouse predeceases or divorces, access terminates — protecting the trust corpus",
      "Trust can be structured to benefit children after both spouses pass",
    ],
    irsCodes: [
      { code: "IRC §2042", title: "Incidents of Ownership", relevance: "Death benefit excluded from estate because the trust — not the grantor — owns the policy. Spouse's access doesn't create incidents of ownership for the grantor." },
      { code: "IRC §2036", title: "Retained Life Estate", relevance: "Grantor must not retain any interest in the trust. Spouse's access is permissible because it's the spouse's interest, not the grantor's retained interest." },
      { code: "IRC §2503(b)", title: "Annual Gift Exclusion", relevance: "Premium payments qualify for annual exclusion through Crummey notices, same as traditional ILIT." },
      { code: "IRC §677", title: "Grantor Trust Income", relevance: "If trust income may be used to pay premiums on grantor's life insurance, the trust may be treated as a grantor trust for income tax purposes." },
    ],
    benefits: [
      "Spouse can access cash value during grantor's lifetime (HEMS standard)",
      "Death benefit excluded from taxable estate",
      "Provides income stream to spouse if needed",
      "Creditor protection for trust assets",
      "Divorce-proof — if marriage ends, spouse's access terminates",
      "Flexibility to choose between income access and death benefit preservation",
      "Reduces both federal and state estate taxes",
      "Provides estate liquidity at death for tax payments",
    ],
    useCases: [
      "Married couples where one spouse is the primary earner",
      "Pre-retirement planning with estate tax concerns",
      "Couples wanting both asset protection and spousal access",
      "Second marriages where protecting children from first marriage is critical",
      "High-net-worth couples needing estate liquidity with flexibility",
    ],
    fundingMethods: [
      "Annual exclusion gifts with Crummey notices",
      "Lifetime exemption gifts",
      "Gift of income-producing assets",
      "Premium financing arrangements",
    ],
    keyRequirements: [
      "Spouse access limited to HEMS standard (Health, Education, Maintenance, Support)",
      "Independent trustee required for discretionary distributions beyond HEMS",
      "Grantor cannot be trustee or beneficiary",
      "Crummey notices required for premium gift tax exclusion",
      "Trust must be irrevocable",
    ],
    typicalClient: "Married couple, age 40-60, net worth $8M+, pre-retirement, wants estate protection without losing access to cash value",
    estateExclusion: true,
    creditorProtection: true,
    spouseAccess: true,
    childAccess: false,
    multiGenerational: false,
    taxFreeGrowth: true,
    scores: { estateProtection: 9, creditorShield: 8, divorceProof: 9, taxEfficiency: 9, flexibility: 8, generationalWealth: 6 },
  },
  {
    id: "blat",
    name: "BLAT",
    fullName: "Beneficiary Limited Access Trust",
    icon: Baby,
    color: "blue",
    colorHex: "#3b82f6",
    tagline: "The Legacy Builder — Give your children access while protecting the gift",
    purpose: "A specialized ILIT that allows a child or other beneficiary limited access to trust cash value and income, while providing creditor protection over the gifted amounts and creating a potential dynastic gift for future generations.",
    howItWorks: [
      "Grantor creates an irrevocable trust naming a child/beneficiary as the primary beneficiary",
      "Trust purchases life insurance on the grantor's life (or the beneficiary's life)",
      "Beneficiary can access cash value distributions through an independent trustee",
      "Creditor protection extends over all gifted amounts held in trust",
      "Trust can be structured as a dynasty trust for multi-generational wealth transfer",
      "Independent third-party trustee is required (not the grantor or beneficiary)",
      "At grantor's death, remaining trust assets pass to next generation per trust terms",
    ],
    irsCodes: [
      { code: "IRC §2042", title: "Incidents of Ownership", relevance: "Death benefit excluded from grantor's estate. Beneficiary's limited access doesn't create incidents of ownership for the grantor." },
      { code: "IRC §2503(b)", title: "Annual Gift Exclusion", relevance: "Contributions to the trust qualify for annual exclusion through Crummey withdrawal rights granted to the beneficiary." },
      { code: "IRC §2503(c)", title: "Gifts to Minors", relevance: "For minor beneficiaries, trust can be structured to comply with §2503(c) requirements for present interest gifts." },
      { code: "IRC §2611", title: "GST Tax", relevance: "If structured as a generation-skipping trust, GST exemption must be allocated to avoid the 40% GST tax on distributions to grandchildren." },
    ],
    benefits: [
      "Child/beneficiary can access cash value through trustee",
      "Creditor protection over all gifted amounts",
      "Potential dynastic gift for future generations",
      "Death benefit excluded from grantor's estate",
      "Teaches financial responsibility through structured access",
      "Protects inheritance from beneficiary's future divorces",
      "Can be combined with GST exemption for multi-generational planning",
    ],
    useCases: [
      "Parents wanting to provide for adult children with asset protection",
      "Families with children who may face creditor issues (entrepreneurs, doctors)",
      "Multi-generational wealth transfer planning",
      "Protecting inheritance from children's future divorces",
      "Families wanting to teach financial responsibility through trust structure",
    ],
    fundingMethods: [
      "Annual exclusion gifts ($18K per beneficiary)",
      "Lifetime exemption gifts ($13.61M per grantor)",
      "Loans or sales to the trust (installment sales)",
      "Gift of income-producing assets",
    ],
    keyRequirements: [
      "Independent third-party trustee required",
      "Beneficiary access must be limited and controlled by trustee",
      "Crummey notices required for gift tax exclusion",
      "Trust must be irrevocable",
      "GST exemption allocation needed for multi-generational planning",
    ],
    typicalClient: "Parent, age 50-70, net worth $10M+, with adult children, wanting to provide access while maintaining asset protection",
    estateExclusion: true,
    creditorProtection: true,
    spouseAccess: false,
    childAccess: true,
    multiGenerational: true,
    taxFreeGrowth: true,
    scores: { estateProtection: 8, creditorShield: 9, divorceProof: 9, taxEfficiency: 8, flexibility: 7, generationalWealth: 9 },
  },
  {
    id: "plat",
    name: "PLAT",
    fullName: "Partner Limited Access Trust",
    icon: Users,
    color: "violet",
    colorHex: "#8b5cf6",
    tagline: "The Modern Shield — Asset protection for unmarried partners and blended families",
    purpose: "A specialized ILIT designed for unmarried partners, providing limited access to trust distributions while maintaining estate exclusion and creditor protection. Essential for non-traditional family structures where standard marital trusts don't apply.",
    howItWorks: [
      "Grantor creates an irrevocable trust naming the non-grantor partner as a permissible beneficiary",
      "Trust purchases life insurance on the grantor's life",
      "Partner receives limited access to distributions through an independent trustee",
      "Death benefit remains outside the grantor's taxable estate",
      "If relationship ends, partner's access can be terminated per trust terms",
      "Trust can name children from prior relationships as remainder beneficiaries",
      "Independent third-party trustee manages all discretionary distributions",
    ],
    irsCodes: [
      { code: "IRC §2042", title: "Incidents of Ownership", relevance: "Death benefit excluded from grantor's estate. Partner's limited access doesn't create incidents of ownership." },
      { code: "IRC §2503(b)", title: "Annual Gift Exclusion", relevance: "Contributions to the trust qualify for annual exclusion through Crummey notices." },
      { code: "IRC §2036", title: "Retained Life Estate", relevance: "Grantor must not retain any interest. Partner's access is a separate beneficiary interest, not a retained interest of the grantor." },
    ],
    benefits: [
      "Provides for unmarried partner without estate tax inclusion",
      "Protects assets if relationship dissolves",
      "Creditor protection for trust assets",
      "Can protect children from prior relationships",
      "Flexible distribution standards through independent trustee",
      "Death benefit passes tax-free to named beneficiaries",
      "Addresses unique needs of non-traditional family structures",
    ],
    useCases: [
      "Young unmarried partners building wealth together",
      "Second marriages where protecting prior family's interests is critical",
      "Divorced individuals with children entering new relationships",
      "Senior couples who choose not to remarry for estate planning reasons",
      "Same-sex couples in states with limited legal protections",
      "Business partners who are also life partners",
    ],
    fundingMethods: [
      "Annual exclusion gifts with Crummey notices",
      "Lifetime exemption gifts",
      "Premium financing arrangements",
    ],
    keyRequirements: [
      "Independent third-party trustee required",
      "Partner access must be limited and controlled",
      "Trust must be irrevocable",
      "Crummey notices required for gift tax exclusion",
      "Clear terms for what happens if relationship ends",
    ],
    typicalClient: "Unmarried partner, age 35-55, net worth $5M+, in committed relationship, with or without children from prior relationships",
    estateExclusion: true,
    creditorProtection: true,
    spouseAccess: false,
    childAccess: false,
    multiGenerational: false,
    taxFreeGrowth: true,
    scores: { estateProtection: 8, creditorShield: 8, divorceProof: 10, taxEfficiency: 7, flexibility: 9, generationalWealth: 5 },
  },
  {
    id: "dynasty",
    name: "Dynasty Trust",
    fullName: "Dynasty Trust",
    icon: Crown,
    color: "amber",
    colorHex: "#f59e0b",
    tagline: "The Empire — Multi-generational wealth that lasts forever",
    purpose: "Creates a perpetual legacy using life insurance that can provide income and wealth transfer across unlimited generations. In the 31 states that have repealed the Rule against Perpetuities, a Dynasty Trust can theoretically last forever — creating a family financial empire.",
    howItWorks: [
      "Grantor creates an irrevocable trust in a state that has repealed the Rule against Perpetuities",
      "Trust purchases life insurance on the grantor's life (and potentially on children's lives)",
      "Trust is designed to pay income to children, then grandchildren, then great-grandchildren, indefinitely",
      "GST exemption is allocated to the trust to avoid generation-skipping transfer tax",
      "Each generation receives income distributions while the trust corpus continues to grow",
      "At each generational level, the trust can purchase additional life insurance to compound the death benefit",
      "The trust can hold IUL policies, fixed annuities, and other assets — all growing tax-deferred",
    ],
    irsCodes: [
      { code: "IRC §2611", title: "Generation-Skipping Transfer", relevance: "Defines what constitutes a generation-skipping transfer. The Dynasty Trust uses GST exemption to shield distributions from the 40% GST tax." },
      { code: "IRC §2612", title: "Direct Skip / Taxable Distribution", relevance: "Distinguishes between direct skips, taxable distributions, and taxable terminations. Proper trust structure avoids triggering these events." },
      { code: "IRC §2642", title: "GST Exemption Allocation", relevance: "Allows allocation of GST exemption ($13.61M per person in 2024) to the trust, making all future distributions GST-tax-free regardless of how many generations benefit." },
      { code: "IRC §2042", title: "Incidents of Ownership", relevance: "Life insurance owned by the Dynasty Trust is excluded from every generation's taxable estate." },
      { code: "IRC §2503(b)", title: "Annual Gift Exclusion", relevance: "Annual contributions to fund premiums qualify for gift tax exclusion through Crummey notices." },
    ],
    benefits: [
      "Wealth can pass through unlimited generations without estate or GST tax",
      "Each generation receives income while preserving the trust corpus",
      "Creditor protection for every generation's interest",
      "Divorce-proof — no generation's spouse can access trust assets",
      "Compounding effect: trust grows exponentially over decades",
      "Can hold multiple asset types (IUL, annuities, real estate, business interests)",
      "In perpetuity states, the trust never terminates",
      "Creates a true family financial dynasty",
    ],
    useCases: [
      "Ultra-high-net-worth families ($20M+) wanting multi-generational wealth",
      "Families with a legacy of entrepreneurship wanting to protect future generations",
      "Clients in states with repealed Rule against Perpetuities",
      "Families wanting to compound life insurance death benefits across generations",
      "Estate plans focused on creating a lasting family financial institution",
    ],
    fundingMethods: [
      "GST exemption allocation ($13.61M per person)",
      "Annual exclusion gifts with Crummey notices",
      "Lifetime exemption gifts",
      "Sale of assets to the trust (installment sale or SCIN)",
      "Premium financing for large policies",
    ],
    keyRequirements: [
      "Must be established in a state that has repealed the Rule against Perpetuities",
      "GST exemption must be properly allocated at creation",
      "Independent trustee required for each generation",
      "Trust document must address succession of trustees across generations",
      "Annual Crummey notices required for gift tax exclusion",
      "Regular review and updating of trust terms as laws change",
    ],
    typicalClient: "Ultra-high-net-worth family, net worth $20M+, multi-generational mindset, located in or willing to establish trust in a perpetuity state",
    estateExclusion: true,
    creditorProtection: true,
    spouseAccess: false,
    childAccess: true,
    multiGenerational: true,
    taxFreeGrowth: true,
    scores: { estateProtection: 10, creditorShield: 10, divorceProof: 10, taxEfficiency: 10, flexibility: 6, generationalWealth: 10 },
  },
];

// ─── DYNASTY TRUST STATES ───────────────────────────────────────────
const PERPETUITY_STATES = [
  "AK", "CO", "DE", "FL", "ID", "IL", "KY", "ME", "MD", "MI",
  "MO", "NE", "NH", "NJ", "NC", "ND", "OH", "PA", "RI", "SD",
  "TN", "UT", "VA", "WI", "WY", "DC", "AL", "AZ", "CT", "NV", "WV",
];

// ─── FORMATTERS ─────────────────────────────────────────────────────
const fmt = (n: number) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
};

// ─── MAIN COMPONENT ────────────────────────────────────────────────
export default function TrustsPage() {
  const [, navigate] = useLocation();
  const [selectedTrust, setSelectedTrust] = useState<string>("ilit");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    howItWorks: true,
    irsCodes: false,
    benefits: true,
    useCases: false,
    funding: false,
    requirements: false,
  });
  const [showComparison, setShowComparison] = useState(false);
  const [showDynastyStates, setShowDynastyStates] = useState(false);

  const trust = TRUST_TYPES.find(t => t.id === selectedTrust) || TRUST_TYPES[0];

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Radar chart data for selected trust
  const radarData = [
    { subject: "Estate Protection", value: trust.scores.estateProtection },
    { subject: "Creditor Shield", value: trust.scores.creditorShield },
    { subject: "Divorce-Proof", value: trust.scores.divorceProof },
    { subject: "Tax Efficiency", value: trust.scores.taxEfficiency },
    { subject: "Flexibility", value: trust.scores.flexibility },
    { subject: "Generational", value: trust.scores.generationalWealth },
  ];

  // Comparison data for bar chart
  const comparisonData = TRUST_TYPES.map(t => ({
    name: t.name,
    estateProtection: t.scores.estateProtection,
    creditorShield: t.scores.creditorShield,
    divorceProof: t.scores.divorceProof,
    taxEfficiency: t.scores.taxEfficiency,
    flexibility: t.scores.flexibility,
    generationalWealth: t.scores.generationalWealth,
    total: Object.values(t.scores).reduce((a, b) => a + b, 0),
  }));

  return (
    <div className="min-h-screen bg-[#0a0e17] text-white">
      {/* HEADER */}
      <div className="sticky top-0 z-50 bg-[#0a0e17]/95 backdrop-blur-xl border-b border-emerald-500/20">
        <div className="max-w-[1600px] mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/portal/dashboard")} className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-400" />
                <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                  TRUST STRUCTURES
                </h1>
              </div>
              <p className="text-[10px] text-gray-500">ILIT, SLAT, BLAT, PLAT & Dynasty Trust — The Foundation of Estate Protection</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowComparison(!showComparison)}
              className={`px-3 py-1.5 text-[10px] font-bold rounded-full border transition-all ${showComparison ? "bg-blue-500/20 text-blue-400 border-blue-500/30" : "bg-white/5 text-gray-400 border-white/10 hover:bg-white/10"}`}>
              {showComparison ? "Hide" : "Show"} Comparison
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-[1600px] mx-auto px-4 py-6 space-y-6">

        {/* ─── TRUST TYPE SELECTOR TABS ─────────────────────────────── */}
        <div className="flex flex-wrap gap-2">
          {TRUST_TYPES.map(t => {
            const Icon = t.icon;
            const isActive = selectedTrust === t.id;
            return (
              <button key={t.id} onClick={() => setSelectedTrust(t.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${
                  isActive
                    ? `bg-${t.color}-500/20 border-${t.color}-500/40 text-white shadow-lg shadow-${t.color}-500/10`
                    : "bg-[#111827] border-white/10 text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
                style={isActive ? { borderColor: t.colorHex + "60", backgroundColor: t.colorHex + "15" } : {}}>
                <Icon className="w-5 h-5" style={{ color: isActive ? t.colorHex : undefined }} />
                <div className="text-left">
                  <span className="text-sm font-bold block" style={{ color: isActive ? t.colorHex : undefined }}>{t.name}</span>
                  <span className="text-[9px] text-gray-500 block">{t.fullName}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── SELECTED TRUST HERO ──────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-2xl border p-6"
          style={{ borderColor: trust.colorHex + "30", background: `linear-gradient(135deg, ${trust.colorHex}10, ${trust.colorHex}05, #11182700)` }}>
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{ backgroundColor: trust.colorHex + "08" }} />
          <div className="relative">
            <div className="flex items-start gap-4">
              <div className="p-4 rounded-xl" style={{ backgroundColor: trust.colorHex + "20" }}>
                <trust.icon className="w-10 h-10" style={{ color: trust.colorHex }} />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white mb-1">{trust.fullName}</h2>
                <p className="text-sm mb-3" style={{ color: trust.colorHex }}>{trust.tagline}</p>
                <p className="text-sm text-gray-300 leading-relaxed">{trust.purpose}</p>

                {/* Quick Feature Badges */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {trust.estateExclusion && <span className="px-2 py-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/20">Estate Exclusion</span>}
                  {trust.creditorProtection && <span className="px-2 py-1 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/20">Creditor Protected</span>}
                  {trust.spouseAccess && <span className="px-2 py-1 text-[10px] font-bold bg-pink-500/20 text-pink-400 rounded-full border border-pink-500/20">Spouse Access</span>}
                  {trust.childAccess && <span className="px-2 py-1 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded-full border border-blue-500/20">Child Access</span>}
                  {trust.multiGenerational && <span className="px-2 py-1 text-[10px] font-bold bg-amber-500/20 text-amber-400 rounded-full border border-amber-500/20">Multi-Generational</span>}
                  {trust.taxFreeGrowth && <span className="px-2 py-1 text-[10px] font-bold bg-green-500/20 text-green-400 rounded-full border border-green-500/20">Tax-Free Growth</span>}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── RADAR CHART + TYPICAL CLIENT ─────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
            <h3 className="text-sm font-bold text-white mb-4">{trust.name} PROTECTION SCORECARD</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#9ca3af", fontSize: 10 }} />
                <PolarRadiusAxis angle={30} domain={[0, 10]} tick={{ fill: "#6b7280", fontSize: 9 }} />
                <Radar name={trust.name} dataKey="value" stroke={trust.colorHex} fill={trust.colorHex} fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
            <h3 className="text-sm font-bold text-white mb-4">TYPICAL CLIENT PROFILE</h3>
            <div className="p-4 rounded-lg border" style={{ borderColor: trust.colorHex + "30", backgroundColor: trust.colorHex + "08" }}>
              <p className="text-sm text-gray-300 leading-relaxed">{trust.typicalClient}</p>
            </div>

            <h4 className="text-xs font-bold text-gray-400 mt-4 mb-2 uppercase">Feature Matrix</h4>
            <div className="space-y-2">
              {[
                { label: "Estate Tax Exclusion", value: trust.estateExclusion },
                { label: "Creditor Protection", value: trust.creditorProtection },
                { label: "Spouse Access", value: trust.spouseAccess },
                { label: "Child/Beneficiary Access", value: trust.childAccess },
                { label: "Multi-Generational", value: trust.multiGenerational },
                { label: "Tax-Free Growth", value: trust.taxFreeGrowth },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1 border-b border-white/5">
                  <span className="text-xs text-gray-400">{item.label}</span>
                  {item.value ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border border-gray-700" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── HOW IT WORKS ────────────────────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <button onClick={() => toggleSection("howItWorks")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5" style={{ color: trust.colorHex }} />
              <h3 className="text-sm font-bold text-white">HOW {trust.name} WORKS — STEP BY STEP</h3>
            </div>
            {expandedSections.howItWorks ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expandedSections.howItWorks && (
            <div className="mt-4 space-y-3">
              {trust.howItWorks.map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/5">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                    style={{ backgroundColor: trust.colorHex + "20", color: trust.colorHex }}>
                    {i + 1}
                  </div>
                  <p className="text-sm text-gray-300 leading-relaxed">{step}</p>
                </div>
              ))}

              {/* Visual Flow Diagram */}
              <div className="mt-4 p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="text-xs font-bold text-gray-400 mb-3 uppercase">Trust Flow Diagram</h4>
                <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
                  <div className="px-3 py-2 rounded-lg bg-blue-500/20 text-blue-400 font-bold border border-blue-500/20">
                    Grantor
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <div className="px-3 py-2 rounded-lg text-white font-bold border"
                    style={{ backgroundColor: trust.colorHex + "20", borderColor: trust.colorHex + "30", color: trust.colorHex }}>
                    {trust.name}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <div className="px-3 py-2 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/20">
                    Life Insurance Policy
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <div className="px-3 py-2 rounded-lg bg-yellow-500/20 text-yellow-400 font-bold border border-yellow-500/20">
                    {trust.id === "dynasty" ? "Children → Grandchildren → Future Gen." :
                     trust.id === "slat" ? "Spouse (HEMS) + Children" :
                     trust.id === "blat" ? "Child/Beneficiary" :
                     trust.id === "plat" ? "Partner + Children" :
                     "Named Beneficiaries"}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-gray-500">
                  <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-emerald-400" /> Outside taxable estate (IRC §2042)</span>
                  <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-blue-400" /> Creditor protected</span>
                  <span className="flex items-center gap-1"><Scale className="w-3 h-3 text-red-400" /> Divorce-proof</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ─── IRS CODES ───────────────────────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <button onClick={() => toggleSection("irsCodes")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">IRS CODE CITATIONS — LEGAL FOUNDATION</h3>
            </div>
            {expandedSections.irsCodes ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expandedSections.irsCodes && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              {trust.irsCodes.map((irc, i) => (
                <div key={i} className="p-4 rounded-lg bg-blue-500/5 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 rounded-full">{irc.code}</span>
                    <span className="text-xs font-bold text-white">{irc.title}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">{irc.relevance}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── BENEFITS ────────────────────────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <button onClick={() => toggleSection("benefits")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">KEY BENEFITS</h3>
            </div>
            {expandedSections.benefits ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expandedSections.benefits && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              {trust.benefits.map((benefit, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300">{benefit}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── USE CASES ───────────────────────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <button onClick={() => toggleSection("useCases")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-bold text-white">IDEAL USE CASES</h3>
            </div>
            {expandedSections.useCases ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expandedSections.useCases && (
            <div className="mt-4 space-y-2">
              {trust.useCases.map((uc, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10">
                  <ArrowRight className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300">{uc}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── FUNDING METHODS ─────────────────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <button onClick={() => toggleSection("funding")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gem className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white">FUNDING METHODS</h3>
            </div>
            {expandedSections.funding ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expandedSections.funding && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
              {trust.fundingMethods.map((method, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-purple-500/5 border border-purple-500/10">
                  <span className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold bg-purple-500/20 text-purple-400 shrink-0">{i + 1}</span>
                  <p className="text-xs text-gray-300">{method}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── KEY REQUIREMENTS ─────────────────────────────────────── */}
        <div className="rounded-xl bg-[#111827] border border-white/10 p-6">
          <button onClick={() => toggleSection("requirements")} className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <h3 className="text-sm font-bold text-white">KEY REQUIREMENTS & WARNINGS</h3>
            </div>
            {expandedSections.requirements ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </button>

          {expandedSections.requirements && (
            <div className="mt-4 space-y-2">
              {trust.keyRequirements.map((req, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-gray-300">{req}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── DYNASTY TRUST STATES ────────────────────────────────── */}
        {selectedTrust === "dynasty" && (
          <div className="rounded-xl bg-[#111827] border border-amber-500/20 p-6">
            <button onClick={() => setShowDynastyStates(!showDynastyStates)} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white">31 STATES WITH REPEALED RULE AGAINST PERPETUITIES</h3>
              </div>
              {showDynastyStates ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
            </button>
            <p className="text-[10px] text-gray-500 mt-1">Dynasty Trusts can last indefinitely in these states</p>

            {showDynastyStates && (
              <div className="mt-4">
                <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {PERPETUITY_STATES.sort().map(st => (
                    <div key={st} className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                      <span className="text-sm font-bold text-amber-400">{st}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-gray-500 mt-3">
                  Top Dynasty Trust states: <strong className="text-amber-400">South Dakota</strong> (no state income tax, strongest asset protection),{" "}
                  <strong className="text-amber-400">Nevada</strong> (no state income tax, strong privacy),{" "}
                  <strong className="text-amber-400">Delaware</strong> (no state income tax on out-of-state beneficiaries),{" "}
                  <strong className="text-amber-400">Alaska</strong> (self-settled trust protection)
                </p>
              </div>
            )}
          </div>
        )}

        {/* ─── INTERACTIVE COMPARISON TABLE ────────────────────────── */}
        {showComparison && (
          <div className="rounded-xl bg-[#111827] border border-blue-500/20 p-6">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-blue-400" /> TRUST TYPE COMPARISON
            </h3>

            {/* Comparison Bar Chart */}
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparisonData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 12 }} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 10 }} domain={[0, 60]} />
                <Tooltip contentStyle={{ background: "#1f2937", border: "1px solid #374151", borderRadius: 8, fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Bar dataKey="estateProtection" name="Estate" fill="#10b981" stackId="a" />
                <Bar dataKey="creditorShield" name="Creditor" fill="#3b82f6" stackId="a" />
                <Bar dataKey="divorceProof" name="Divorce" fill="#ef4444" stackId="a" />
                <Bar dataKey="taxEfficiency" name="Tax" fill="#f59e0b" stackId="a" />
                <Bar dataKey="flexibility" name="Flexibility" fill="#8b5cf6" stackId="a" />
                <Bar dataKey="generationalWealth" name="Generational" fill="#ec4899" stackId="a" />
              </BarChart>
            </ResponsiveContainer>

            {/* Comparison Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 px-3 text-gray-400">Feature</th>
                    {TRUST_TYPES.map(t => (
                      <th key={t.id} className="text-center py-2 px-3" style={{ color: t.colorHex }}>{t.name}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Estate Tax Exclusion", key: "estateExclusion" },
                    { label: "Creditor Protection", key: "creditorProtection" },
                    { label: "Spouse Access", key: "spouseAccess" },
                    { label: "Child Access", key: "childAccess" },
                    { label: "Multi-Generational", key: "multiGenerational" },
                    { label: "Tax-Free Growth", key: "taxFreeGrowth" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/5">
                      <td className="py-2 px-3 text-gray-300">{row.label}</td>
                      {TRUST_TYPES.map(t => (
                        <td key={t.id} className="text-center py-2 px-3">
                          {(t as any)[row.key] ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                          ) : (
                            <span className="w-4 h-4 rounded-full border border-gray-700 block mx-auto" />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t border-white/10">
                    <td className="py-2 px-3 text-gray-300 font-bold">Total Score</td>
                    {TRUST_TYPES.map(t => (
                      <td key={t.id} className="text-center py-2 px-3 font-bold" style={{ color: t.colorHex }}>
                        {Object.values(t.scores).reduce((a, b) => a + b, 0)}/60
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ─── BOTTOM CTA ──────────────────────────────────────────── */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-950/60 via-blue-950/40 to-purple-950/60 border border-emerald-500/30 p-8 text-center">
          <Landmark className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">Every Trust Starts with a Conversation</h2>
          <p className="text-sm text-gray-300 max-w-2xl mx-auto mb-4">
            The right trust structure depends on your client's net worth, family situation, state of residence, and goals.
            Use our tools to model the impact and find the perfect fit.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => navigate("/portal/divorce-calculator")} className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl transition-colors text-sm">
              Divorce Devastation Engine
            </button>
            <button onClick={() => navigate("/portal/client-intake")} className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl transition-colors text-sm">
              Client Intake Recommender
            </button>
            <button onClick={() => navigate("/portal/strategy-compare")} className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-colors text-sm border border-white/20">
              Compare Strategies
            </button>
          </div>
        </div>

        {/* ─── DISCLAIMER ──────────────────────────────────────────── */}
        <div className="text-[9px] text-gray-600 text-center px-8 pb-8">
          <p>This page is for educational and illustrative purposes only. It does not constitute legal, tax, or financial advice.
          Trust structures must be drafted by qualified estate planning attorneys. IRS code citations are current as of 2024.
          State-specific rules may vary. Consult with qualified legal and tax professionals before establishing any trust.
          Russell Capital — www.russellcap.com</p>
        </div>
      </div>
    </div>
  );
}

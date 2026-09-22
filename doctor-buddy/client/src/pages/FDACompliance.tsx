/**
 * FDA Pre-Submission SaMD Documentation Portal
 * Designed by: Grok-3 (regulatory strategy) + Claude (compliance) + OpenAI (architecture)
 *
 * Software as a Medical Device (SaMD) Pre-Submission Tracker
 * Tracks: IEC 62304 compliance, clinical validation, risk classification, 510(k) pathway
 */
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import NavBar from "@/components/NavBar";
import {
  FileText, Shield, CheckCircle2, AlertTriangle, Clock,
  ChevronRight, ExternalLink, Lock, Activity, Clipboard,
  BookOpen, Scale, Microscope, Server, Users, BarChart3,
  ArrowRight, CircleDot, XCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

// ─── SaMD Classification Data ────────────────────────────────────────────────
const SAMD_CLASSIFICATION = {
  product: "Dr. Buddy AI — Psychiatric Decision Support System",
  intendedUse: "AI-powered psychiatric screening and decision support tool that provides preliminary mental health assessments, risk scoring, and treatment recommendations to support clinical decision-making.",
  classification: "Class II (De Novo or 510(k))",
  riskLevel: "Moderate Risk — SaMD Category II (Treat or Diagnose, Non-Serious)",
  predicate: "No direct predicate; De Novo pathway recommended per FDA Digital Health guidance",
  regulatoryPathway: "De Novo Classification Request (21 CFR 860.260)",
};

type DocStatus = "complete" | "in_progress" | "not_started" | "blocked";

interface ComplianceDoc {
  id: string;
  title: string;
  category: string;
  standard: string;
  status: DocStatus;
  description: string;
  requirements: string[];
  resources: { label: string; url: string }[];
  progress: number;
}

const COMPLIANCE_DOCS: ComplianceDoc[] = [
  {
    id: "qms",
    title: "Quality Management System (QMS)",
    category: "Foundation",
    standard: "ISO 13485:2016",
    status: "in_progress",
    description: "Documented quality management system covering design controls, risk management, and corrective/preventive actions.",
    progress: 35,
    requirements: [
      "Quality Manual documenting QMS scope and processes",
      "Design and Development procedures (Design Controls)",
      "Document Control and Records Management",
      "Management Review procedures",
      "Corrective and Preventive Action (CAPA) system",
      "Supplier and vendor qualification procedures",
    ],
    resources: [
      { label: "ISO 13485 Overview", url: "https://www.iso.org/standard/59752.html" },
      { label: "FDA QSR 21 CFR 820", url: "https://www.ecfr.gov/current/title-21/chapter-I/subchapter-H/part-820" },
    ],
  },
  {
    id: "sw-lifecycle",
    title: "Software Development Lifecycle",
    category: "Development",
    standard: "IEC 62304:2006+A1:2015",
    status: "in_progress",
    description: "Software lifecycle processes including requirements, architecture, implementation, testing, and maintenance for medical device software.",
    progress: 45,
    requirements: [
      "Software Development Plan (SDP)",
      "Software Requirements Specification (SRS)",
      "Software Architecture Design Document",
      "Software Detailed Design Document",
      "Software Unit & Integration Test Plans",
      "Software Release and Maintenance Plan",
      "Problem Resolution process",
      "Software Configuration Management Plan",
    ],
    resources: [
      { label: "IEC 62304 Summary", url: "https://www.johner-institute.com/articles/software-iec-62304/" },
      { label: "FDA Software Guidance", url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/content-premarket-submissions-device-software-functions" },
    ],
  },
  {
    id: "risk-mgmt",
    title: "Risk Management File",
    category: "Safety",
    standard: "ISO 14971:2019",
    status: "in_progress",
    description: "Comprehensive risk management process covering hazard identification, risk estimation, risk evaluation, risk control, and residual risk assessment.",
    progress: 30,
    requirements: [
      "Risk Management Plan",
      "Hazard Analysis (FMEA / FTA)",
      "Risk Estimation and Evaluation matrices",
      "Risk Control measures and verification",
      "Residual Risk assessment",
      "Risk-Benefit Analysis",
      "Risk Management Report",
    ],
    resources: [
      { label: "ISO 14971 Overview", url: "https://www.iso.org/standard/72704.html" },
      { label: "FDA Risk Guidance", url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/factors-consider-when-making-benefit-risk-determinations-medical-device-premarket-review" },
    ],
  },
  {
    id: "clinical-eval",
    title: "Clinical Evaluation & Validation",
    category: "Clinical",
    standard: "FDA Clinical Evidence Guidance",
    status: "not_started",
    description: "Clinical evidence demonstrating safety and effectiveness of the SaMD, including analytical validation, clinical validation, and real-world performance data.",
    progress: 0,
    requirements: [
      "Analytical Validation Protocol & Report",
      "Clinical Validation Protocol (prospective study design)",
      "Clinical Validation Report with statistical analysis",
      "Real-World Performance monitoring plan",
      "Clinical Investigation Plan (if applicable)",
      "Literature review of AI/ML in psychiatric assessment",
    ],
    resources: [
      { label: "FDA SaMD Clinical Evaluation", url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/clinical-decision-support-software" },
      { label: "IMDRF SaMD Framework", url: "https://www.imdrf.org/documents/software-medical-device-samd-clinical-evaluation" },
    ],
  },
  {
    id: "ai-ml",
    title: "AI/ML Algorithm Documentation",
    category: "AI/ML",
    standard: "FDA AI/ML SaMD Action Plan",
    status: "in_progress",
    description: "Documentation of AI/ML algorithms including training data, model architecture, performance metrics, bias analysis, and continuous learning plan.",
    progress: 40,
    requirements: [
      "Algorithm Description Document (model architecture, training approach)",
      "Training Data Management Plan (data sources, labeling, quality)",
      "Model Performance Report (sensitivity, specificity, AUC, F1)",
      "Bias and Fairness Analysis (demographic subgroups)",
      "Predetermined Change Control Plan (PCCP) for model updates",
      "Transparency and Explainability documentation",
      "Good Machine Learning Practice (GMLP) adherence report",
    ],
    resources: [
      { label: "FDA AI/ML Action Plan", url: "https://www.fda.gov/medical-devices/software-medical-device-samd/artificial-intelligence-and-machine-learning-aiml-software-medical-device" },
      { label: "GMLP Guiding Principles", url: "https://www.fda.gov/medical-devices/software-medical-device-samd/good-machine-learning-practice-medical-device-development-guiding-principles" },
    ],
  },
  {
    id: "cybersecurity",
    title: "Cybersecurity Documentation",
    category: "Security",
    standard: "FDA Cybersecurity Guidance 2023",
    status: "in_progress",
    description: "Cybersecurity risk assessment, threat modeling, and security controls documentation for the SaMD.",
    progress: 50,
    requirements: [
      "Threat Model (STRIDE methodology)",
      "Cybersecurity Risk Assessment",
      "Software Bill of Materials (SBOM)",
      "Security Architecture Design",
      "Vulnerability Management Plan",
      "Patch Management and Update procedures",
      "Incident Response Plan",
    ],
    resources: [
      { label: "FDA Cybersecurity Guidance", url: "https://www.fda.gov/regulatory-information/search-fda-guidance-documents/cybersecurity-medical-devices-quality-system-considerations-and-content-premarket-submissions" },
    ],
  },
  {
    id: "labeling",
    title: "Labeling & Instructions for Use",
    category: "Regulatory",
    standard: "21 CFR 801",
    status: "not_started",
    description: "Product labeling including intended use, indications, contraindications, warnings, and instructions for use.",
    progress: 0,
    requirements: [
      "Intended Use / Indications for Use statement",
      "Contraindications and Warnings",
      "Instructions for Use (IFU)",
      "User interface labeling requirements",
      "Disclaimer: Not a diagnostic tool — clinical decision support only",
    ],
    resources: [
      { label: "FDA Labeling Requirements", url: "https://www.fda.gov/medical-devices/overview-device-regulation/device-labeling" },
    ],
  },
  {
    id: "hipaa",
    title: "HIPAA & Privacy Compliance",
    category: "Privacy",
    standard: "HIPAA / 45 CFR Parts 160, 164",
    status: "in_progress",
    description: "Health Insurance Portability and Accountability Act compliance including privacy, security, and breach notification rules.",
    progress: 60,
    requirements: [
      "Privacy Impact Assessment",
      "Security Risk Assessment",
      "Business Associate Agreements (BAAs)",
      "Data encryption at rest and in transit",
      "Access control and audit logging",
      "Breach Notification procedures",
      "Patient consent and data rights management",
    ],
    resources: [
      { label: "HHS HIPAA Guidance", url: "https://www.hhs.gov/hipaa/index.html" },
    ],
  },
];

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string; icon: typeof CheckCircle2; bgColor: string }> = {
  complete: { label: "Complete", color: "text-green-400", icon: CheckCircle2, bgColor: "bg-green-950/30" },
  in_progress: { label: "In Progress", color: "text-blue-400", icon: Clock, bgColor: "bg-blue-950/30" },
  not_started: { label: "Not Started", color: "text-gray-500", icon: CircleDot, bgColor: "bg-gray-900/30" },
  blocked: { label: "Blocked", color: "text-red-400", icon: XCircle, bgColor: "bg-red-950/30" },
};

const CATEGORIES = ["Foundation", "Development", "Safety", "Clinical", "AI/ML", "Security", "Regulatory", "Privacy"];

export default function FDACompliance() {
  const { isAuthenticated, user } = useAuth();
  const [selectedDoc, setSelectedDoc] = useState<ComplianceDoc | null>(null);
  const [filterCategory, setFilterCategory] = useState<string | null>(null);

  const filteredDocs = filterCategory
    ? COMPLIANCE_DOCS.filter((d) => d.category === filterCategory)
    : COMPLIANCE_DOCS;

  const overallProgress = Math.round(COMPLIANCE_DOCS.reduce((sum, d) => sum + d.progress, 0) / COMPLIANCE_DOCS.length);
  const completedCount = COMPLIANCE_DOCS.filter((d) => d.status === "complete").length;
  const inProgressCount = COMPLIANCE_DOCS.filter((d) => d.status === "in_progress").length;
  const notStartedCount = COMPLIANCE_DOCS.filter((d) => d.status === "not_started").length;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <NavBar />

      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950/40 via-gray-950 to-blue-950/30" />
        <div className="relative container py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-600/20 border border-emerald-700/30">
              <Shield className="h-8 w-8 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">FDA Pre-Submission Portal</h1>
              <p className="text-gray-400 text-sm">Software as a Medical Device (SaMD) Compliance Dashboard</p>
            </div>
          </div>

          {/* Product Classification Card */}
          <Card className="bg-gray-900/60 border-gray-800 mt-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Product</p>
                  <p className="text-sm font-medium text-white mt-1">{SAMD_CLASSIFICATION.product}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Classification</p>
                  <p className="text-sm font-medium text-emerald-400 mt-1">{SAMD_CLASSIFICATION.classification}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Risk Level</p>
                  <p className="text-sm font-medium text-yellow-400 mt-1">{SAMD_CLASSIFICATION.riskLevel}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Regulatory Pathway</p>
                  <p className="text-sm font-medium text-blue-400 mt-1">{SAMD_CLASSIFICATION.regulatoryPathway}</p>
                </div>
                <div className="md:col-span-2">
                  <p className="text-xs text-gray-500 uppercase tracking-wider">Intended Use</p>
                  <p className="text-sm text-gray-300 mt-1">{SAMD_CLASSIFICATION.intendedUse}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Stats */}
      <div className="container py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-emerald-400">{overallProgress}%</div>
              <p className="text-xs text-gray-500 mt-1">Overall Progress</p>
              <div className="w-full h-2 bg-gray-800 rounded-full mt-2">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${overallProgress}%` }} />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-green-400">{completedCount}</div>
              <p className="text-xs text-gray-500 mt-1">Complete</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-blue-400">{inProgressCount}</div>
              <p className="text-xs text-gray-500 mt-1">In Progress</p>
            </CardContent>
          </Card>
          <Card className="bg-gray-900/60 border-gray-800">
            <CardContent className="p-4 text-center">
              <div className="text-3xl font-bold text-gray-500">{notStartedCount}</div>
              <p className="text-xs text-gray-500 mt-1">Not Started</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Category Filters */}
      <div className="container pb-4">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={filterCategory === null ? "default" : "outline"}
            onClick={() => setFilterCategory(null)}
            className="text-xs"
          >
            All ({COMPLIANCE_DOCS.length})
          </Button>
          {CATEGORIES.map((cat) => {
            const count = COMPLIANCE_DOCS.filter((d) => d.category === cat).length;
            if (count === 0) return null;
            return (
              <Button
                key={cat}
                size="sm"
                variant={filterCategory === cat ? "default" : "outline"}
                onClick={() => setFilterCategory(cat)}
                className="text-xs"
              >
                {cat} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Document Grid */}
      <div className="container pb-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDocs.map((doc) => {
            const statusCfg = STATUS_CONFIG[doc.status];
            const StatusIcon = statusCfg.icon;
            return (
              <Card
                key={doc.id}
                className={`bg-gray-900/60 border-gray-800 hover:border-gray-700 transition-all cursor-pointer ${
                  selectedDoc?.id === doc.id ? "ring-2 ring-emerald-500/50" : ""
                }`}
                onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
              >
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">{doc.category}</span>
                        <span className={`text-xs flex items-center gap-1 ${statusCfg.color}`}>
                          <StatusIcon className="h-3 w-3" /> {statusCfg.label}
                        </span>
                      </div>
                      <h3 className="text-sm font-semibold text-white">{doc.title}</h3>
                      <p className="text-xs text-gray-500 mt-0.5">{doc.standard}</p>
                    </div>
                    <div className="shrink-0 w-12 h-12 rounded-full border-4 border-gray-800 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-300">{doc.progress}%</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-gray-800 rounded-full mt-3">
                    <div
                      className={`h-full rounded-full transition-all ${
                        doc.progress >= 80 ? "bg-green-500" : doc.progress >= 40 ? "bg-blue-500" : doc.progress > 0 ? "bg-yellow-500" : "bg-gray-700"
                      }`}
                      style={{ width: `${doc.progress}%` }}
                    />
                  </div>

                  {/* Expanded Detail */}
                  {selectedDoc?.id === doc.id && (
                    <div className="mt-4 pt-4 border-t border-gray-800 space-y-4">
                      <p className="text-sm text-gray-300">{doc.description}</p>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Requirements</h4>
                        <div className="space-y-1.5">
                          {doc.requirements.map((req, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <div className={`shrink-0 mt-1 h-3 w-3 rounded-full border ${
                                i < Math.floor(doc.requirements.length * (doc.progress / 100))
                                  ? "bg-emerald-500 border-emerald-500"
                                  : "border-gray-600"
                              }`} />
                              <p className="text-xs text-gray-400">{req}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Resources</h4>
                        <div className="space-y-1">
                          {doc.resources.map((res, i) => (
                            <a
                              key={i}
                              href={res.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-xs text-blue-400 hover:text-blue-300"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-3 w-3" /> {res.label}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Pre-Submission Timeline */}
      <div className="container pb-12">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-400" />
          Pre-Submission Timeline
        </h2>
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-800" />
          {[
            { phase: "Phase 1", title: "QMS & Design Controls Setup", timeline: "Months 1-3", status: "in_progress" as DocStatus, items: ["Establish QMS per ISO 13485", "Implement Design Controls per 21 CFR 820.30", "Begin Risk Management per ISO 14971"] },
            { phase: "Phase 2", title: "Software Lifecycle & AI Documentation", timeline: "Months 3-6", status: "in_progress" as DocStatus, items: ["Complete IEC 62304 lifecycle documentation", "Document AI/ML algorithms and training data", "Conduct bias and fairness analysis"] },
            { phase: "Phase 3", title: "Clinical Validation", timeline: "Months 6-12", status: "not_started" as DocStatus, items: ["Design and execute analytical validation", "Conduct prospective clinical study", "Generate clinical evidence report"] },
            { phase: "Phase 4", title: "Pre-Submission Meeting", timeline: "Month 12", status: "not_started" as DocStatus, items: ["Submit Pre-Sub package to FDA", "Pre-Submission meeting with FDA reviewers", "Incorporate FDA feedback into submission strategy"] },
            { phase: "Phase 5", title: "De Novo Submission", timeline: "Months 12-18", status: "not_started" as DocStatus, items: ["Compile complete De Novo submission", "Submit to FDA CDRH", "Respond to any Additional Information requests"] },
          ].map((phase, i) => {
            const cfg = STATUS_CONFIG[phase.status];
            const Icon = cfg.icon;
            return (
              <div key={i} className="relative pl-14 pb-8">
                <div className={`absolute left-4 w-5 h-5 rounded-full border-2 ${
                  phase.status === "complete" ? "bg-green-500 border-green-500" :
                  phase.status === "in_progress" ? "bg-blue-500 border-blue-500 animate-pulse" :
                  "bg-gray-800 border-gray-600"
                }`} />
                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-xs font-mono text-gray-500">{phase.phase}</span>
                  <h3 className="text-sm font-semibold text-white">{phase.title}</h3>
                  <span className={`text-xs ${cfg.color}`}>{phase.timeline}</span>
                </div>
                <div className="space-y-1">
                  {phase.items.map((item, j) => (
                    <p key={j} className="text-xs text-gray-500 flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-gray-700" /> {item}
                    </p>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="container pb-12">
        <Card className="bg-yellow-950/20 border-yellow-800/30">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-semibold text-yellow-400">Important Disclaimer</h4>
                <p className="text-xs text-gray-400 mt-1">
                  This portal is an internal tracking tool for FDA pre-submission preparation. It does not constitute legal or regulatory advice.
                  All regulatory submissions must be reviewed by qualified regulatory affairs professionals and legal counsel before filing with the FDA.
                  Doctor Buddy recommends engaging a regulatory consultant experienced in SaMD and AI/ML medical devices.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

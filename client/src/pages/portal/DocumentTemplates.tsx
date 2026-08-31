// @ts-nocheck
import { useState, useMemo, useEffect, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area, 
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, Legend
} from "recharts";
import { ExportToSlides } from "@/components/ExportToSlides";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NAICDisclaimer } from "@/components/NAICDisclaimer";
import {
  FileText,
  Copy,
  Search,
  Star,
  Mail,
  FileCheck,
  ClipboardList,
  Shield,
  Filter,
  Edit3,
  Share2,
  Eye,
  Clock,
  Link,
  Activity,
  TrendingUp,
  Users,
  MessageSquare,
  FileIcon,
  Layers,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899", "#06b6d4"];

const usageData = [
  { month: "Jan", uses: 45, shares: 12, views: 150 },
  { month: "Feb", uses: 52, shares: 18, views: 180 },
  { month: "Mar", uses: 61, shares: 24, views: 210 },
  { month: "Apr", uses: 58, shares: 20, views: 190 },
  { month: "May", uses: 73, shares: 35, views: 250 },
  { month: "Jun", uses: 84, shares: 42, views: 310 }
];

const categoryDistribution = [
  { name: "Client Letters", value: 35 },
  { name: "Strategy Memos", value: 25 },
  { name: "Meeting Templates", value: 20 },
  { name: "Client Forms", value: 15 },
  { name: "Compliance", value: 5 }
];

const templatePerformance = [
  { name: "IUL Intro", conversion: 85, views: 120 },
  { name: "Roth Memo", conversion: 65, views: 95 },
  { name: "Review Agenda", conversion: 90, views: 210 },
  { name: "Estate Form", conversion: 45, views: 60 },
  { name: "Suitability", conversion: 100, views: 150 }
];

const tagsData = [
  { subject: "Retirement", A: 120, B: 110, fullMark: 150 },
  { subject: "Tax", A: 98, B: 130, fullMark: 150 },
  { subject: "Estate", A: 86, B: 130, fullMark: 150 },
  { subject: "Insurance", A: 99, B: 100, fullMark: 150 },
  { subject: "Education", A: 85, B: 90, fullMark: 150 },
  { subject: "Compliance", A: 65, B: 85, fullMark: 150 },
];

const complianceData = [
  { date: "W1", passed: 40, flagged: 2 },
  { date: "W2", passed: 45, flagged: 1 },
  { date: "W3", passed: 38, flagged: 3 },
  { date: "W4", passed: 50, flagged: 0 }
];

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  content: string;
  tags: string[];
  starred: boolean;
  lastModified: string;
  author: string;
  version: string;
}

const TEMPLATES: Template[] = [
  {
    id: "1", name: "IUL Introduction Letter", category: "Client Letters",
    description: "Professional introduction to Indexed Universal Life insurance concepts",
    tags: ["IUL", "introduction", "client-facing"],
    starred: true,
    lastModified: "2023-10-15",
    author: "Russell Capital",
    version: "v2.1",
    content: `Dear [Client Name],\n\nThank you for taking the time to meet with us on [Date]. As we discussed, I'd like to introduce you to a financial strategy that many of our clients in similar situations have found valuable: Indexed Universal Life (IUL) insurance.\n\nWhat makes IUL unique:\n- Your illustrated cash value participates in market gains through index-linked crediting\n- A built-in floor (typically 0%) protects your illustrated cash value from market losses\n- Policy loans can provide tax-free retirement income when structured properly\n- The death benefit provides legacy protection for your family\n\nBased on our conversation about your goals—specifically [specific goals]—I believe an IUL policy could complement your existing retirement strategy by providing:\n\n1. Tax-free supplemental retirement income through policy loans\n2. Protection against market downturns with the 0% floor\n3. A death benefit that passes tax-free to your beneficiaries\n4. Flexibility to adjust premiums as your situation changes\n\nI've attached an illustration showing how a policy with a [premium amount] annual premium could perform over time. Please note that illustrated values are not guaranteed and actual results will vary based on index performance and policy charges.\n\nI'd love to schedule a follow-up meeting to walk through the illustration in detail and answer any questions you may have.\n\nBest regards,\n[Advisor Name]\nRussell Capital Systems™\n\nIMPORTANT: This letter is for informational purposes only. Illustrated values shown in any accompanying materials are not guaranteed. Please refer to the policy illustration for guaranteed values and important disclosures.`,
  },
  {
    id: "2", name: "Roth Conversion Recommendation", category: "Strategy Memos",
    description: "Detailed memo explaining Roth conversion strategy and benefits",
    tags: ["Roth", "tax", "conversion", "strategy"],
    starred: true,
    lastModified: "2023-11-02",
    author: "Tax Planning Team",
    version: "v1.4",
    content: `STRATEGY MEMO: Roth Conversion Recommendation\n\nClient: [Client Name]\nDate: [Date]\nPrepared by: [Advisor Name]\n\nEXECUTIVE SUMMARY\nBased on our analysis of your current tax situation and retirement projections, we recommend implementing a systematic Roth conversion strategy over the next [X] years.\n\nCURRENT SITUATION\n- Traditional IRA/401(k) Balance: $[amount]\n- Current Tax Bracket: [bracket]%\n- Years to Retirement: [years]\n- Projected RMD at Age 73: $[amount]/year\n\nRECOMMENDED STRATEGY\nConvert $[amount] per year from your Traditional IRA to a Roth IRA over [X] years.\n\nBENEFITS\n1. Reduce future RMDs by approximately [X]%\n2. Create tax-free income in retirement\n3. Eliminate IRMAA surcharges on Medicare premiums\n4. Provide tax-free inheritance for beneficiaries\n5. Hedge against future tax rate increases\n\nTAX IMPACT\n- Annual conversion tax cost: approximately $[amount]\n- Total conversion tax over [X] years: approximately $[amount]\n- Projected tax savings over 20-year retirement: approximately $[amount]\n- Net benefit: approximately $[amount]\n\nIMPORTANT CONSIDERATIONS\n- Conversions are irrevocable once completed\n- Tax is due on the conversion amount in the year of conversion\n- This strategy works best when current tax rates are lower than projected future rates\n- We recommend funding the tax from non-retirement assets to maximize the benefit\n\nNEXT STEPS\n1. Confirm conversion amount for current tax year\n2. Coordinate with CPA for estimated tax payment\n3. Execute first conversion before December 31\n4. Review and adjust annually based on tax situation\n\nThis recommendation is based on current tax law and your stated financial situation. Tax laws may change, and individual results will vary.`,
  },
  {
    id: "3", name: "Annual Review Agenda", category: "Meeting Templates",
    description: "Structured agenda for annual client review meetings",
    tags: ["meeting", "annual review", "agenda"],
    starred: false,
    lastModified: "2023-09-20",
    author: "Client Success",
    version: "v3.0",
    content: `ANNUAL REVIEW MEETING AGENDA\n\nClient: [Client Name]\nDate: [Date]\nTime: [Time]\nLocation: [Location/Virtual Link]\n\n1. WELCOME & OVERVIEW (5 minutes)\n   - Review meeting objectives\n   - Confirm time available\n\n2. LIFE CHANGES UPDATE (10 minutes)\n   - Family changes (marriage, children, grandchildren)\n   - Health updates\n   - Employment/income changes\n   - Major purchases or expenses\n   - Changes in goals or priorities\n\n3. PORTFOLIO REVIEW (15 minutes)\n   - Current asset allocation\n   - Performance vs. benchmarks\n   - Rebalancing recommendations\n   - New investment opportunities\n\n4. INSURANCE REVIEW (10 minutes)\n   - Life insurance coverage adequacy\n   - IUL policy performance (if applicable)\n   - Annuity contract review\n   - Long-term care considerations\n\n5. TAX PLANNING (10 minutes)\n   - Current year tax situation\n   - Roth conversion opportunities\n   - RMD planning (if applicable)\n   - Tax-loss harvesting opportunities\n\n6. ESTATE PLANNING (5 minutes)\n   - Beneficiary designation review\n   - Trust/will updates needed\n   - Estate tax exposure assessment\n\n7. ACTION ITEMS & NEXT STEPS (5 minutes)\n   - Summarize recommendations\n   - Assign action items with deadlines\n   - Schedule follow-up meetings\n   - Set next annual review date\n\nPREPARATION CHECKLIST:\n[ ] Updated financial statements\n[ ] Recent tax returns\n[ ] Current insurance policy statements\n[ ] Any new estate planning documents\n[ ] Questions or concerns to discuss`,
  },
  {
    id: "4", name: "Estate Planning Questionnaire", category: "Client Forms",
    description: "Comprehensive questionnaire for estate planning discovery",
    tags: ["estate", "questionnaire", "discovery"],
    starred: false,
    lastModified: "2023-08-11",
    author: "Estate Planning Team",
    version: "v1.2",
    content: `ESTATE PLANNING QUESTIONNAIRE\n\nClient Name: _______________\nDate: _______________\n\nSECTION 1: PERSONAL INFORMATION\nFull Legal Name: _______________\nDate of Birth: _______________\nSocial Security Number: _______________\nCitizenship: _______________\n\nSpouse Name: _______________\nSpouse Date of Birth: _______________\n\nChildren (list all):\nName: _______________ Age: ___ Minor? Y/N\nName: _______________ Age: ___ Minor? Y/N\nName: _______________ Age: ___ Minor? Y/N\n\nSECTION 2: EXISTING DOCUMENTS\nDo you have a current will? Y/N  Date: ___\nDo you have a revocable trust? Y/N  Date: ___\nDo you have a power of attorney? Y/N  Date: ___\nDo you have a healthcare directive? Y/N  Date: ___\nDo you have an irrevocable trust? Y/N  Type: ___\n\nSECTION 3: ASSETS\nPrimary Residence: $_______________\nOther Real Estate: $_______________\nRetirement Accounts (IRA/401k): $_______________\nRoth IRA: $_______________\nBrokerage Accounts: $_______________\nLife Insurance Death Benefit: $_______________\nBusiness Interests: $_______________\nOther Assets: $_______________\nTOTAL ESTIMATED ESTATE: $_______________\n\nSECTION 4: BENEFICIARY DESIGNATIONS\nAre all beneficiary designations current? Y/N\nLast time reviewed: _______________\n\nSECTION 5: GOALS & CONCERNS\nPrimary estate planning goals:\n1. _______________\n2. _______________\n3. _______________\n\nSpecific concerns:\n[ ] Minimizing estate taxes\n[ ] Protecting assets from creditors\n[ ] Providing for minor children\n[ ] Special needs planning\n[ ] Charitable giving\n[ ] Business succession\n[ ] Blended family considerations\n[ ] Other: _______________`,
  },
  {
    id: "5", name: "Suitability Documentation", category: "Compliance",
    description: "NAIC-compliant suitability documentation template",
    tags: ["compliance", "suitability", "NAIC"],
    starred: true,
    lastModified: "2023-12-01",
    author: "Compliance Dept",
    version: "v4.0",
    content: `SUITABILITY DOCUMENTATION\n(NAIC Model Regulation #670 Compliant)\n\nDate: _______________\nClient Name: _______________\nAdvisor Name: _______________\n\nSECTION 1: CLIENT PROFILE\nAge: ___  Annual Income: $_______________\nNet Worth: $_______________  Liquid Net Worth: $_______________\nTax Filing Status: _______________\nRisk Tolerance: [ ] Conservative [ ] Moderate [ ] Aggressive\nInvestment Time Horizon: _____ years\nInvestment Objectives: [ ] Growth [ ] Income [ ] Preservation [ ] Liquidity\n\nSECTION 2: FINANCIAL NEEDS ANALYSIS\nPrimary Financial Concerns:\n1. _______________\n2. _______________\n3. _______________\n\nExisting Insurance Coverage:\nType: _______________ Amount: $___ Carrier: _______________\nType: _______________ Amount: $___ Carrier: _______________\n\nSECTION 3: PRODUCT RECOMMENDATION\nProduct Type: _______________\nCarrier: _______________\nProduct Name: _______________\nAnnual Premium: $_______________\n\nRATIONALE FOR RECOMMENDATION:\nThis product is suitable for the client because:\n1. _______________\n2. _______________\n3. _______________\n\nSECTION 4: ALTERNATIVES CONSIDERED\nAlternative 1: _______________\nReason not selected: _______________\n\nAlternative 2: _______________\nReason not selected: _______________\n\nSECTION 5: DISCLOSURES\n[ ] Guaranteed vs. illustrated values explained\n[ ] Surrender charges disclosed\n[ ] Policy fees and charges explained\n[ ] Tax implications discussed\n[ ] Replacement analysis completed (if applicable)\n\nSECTION 6: SIGNATURES\nClient Signature: _______________ Date: ___\nAdvisor Signature: _______________ Date: ___\n\nThis documentation is maintained in the client file and subject to regulatory review.`,
  }
];

export default function DocumentTemplates() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>(TEMPLATES);
  const [activeTab, setActiveTab] = useState("all");
  
  const docsQuery = trpc.docs.getTemplates.useQuery(undefined, { enabled: false });
  const templatesQuery = trpc.documentVault.getDocuments.useQuery(undefined, { enabled: false });
  const complianceQuery = trpc.complianceTracking.getStatus.useQuery(undefined, { enabled: false });
  const usageQuery = trpc.websiteUsage.getStats.useQuery(undefined, { enabled: false });
  const aiQuery = trpc.ai.generateContent.useMutation();
  const exportMutation = trpc.strategyExport.exportPdf.useMutation();
  const tagsQuery = trpc.tags.getAll.useQuery(undefined, { enabled: false });

  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showStats, setShowStats] = useState(true);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState("name");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showCompliance, setShowCompliance] = useState(false);
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [exportFormat, setExportFormat] = useState("pdf");
  const [fontSize, setFontSize] = useState(14);
  const [theme, setTheme] = useState("dark");
  const [showHistory, setShowHistory] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareEmail, setShareEmail] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState("latest");
  const [autoSave, setAutoSave] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [expandAnalytics, setExpandAnalytics] = useState(false);

  const categories = useMemo(() => {
    const cats = new Set(templates.map((t) => t.category));
    return Array.from(cats);
  }, [templates]);

  const allTags = useMemo(() => {
    const tags = new Set<string>();
    templates.forEach((t) => t.tags.forEach((tag) => tags.add(tag)));
    return Array.from(tags);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    let result = templates;
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) => 
        t.name.toLowerCase().includes(q) || 
        t.description.toLowerCase().includes(q) ||
        t.tags.some(tag => tag.toLowerCase().includes(q))
      );
    }
    
    if (filterTag) {
      result = result.filter((t) => t.tags.includes(filterTag));
    }
    
    if (sortBy === "name") {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === "date") {
      result = [...result].sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    }
    
    return result;
  }, [templates, searchQuery, filterTag, sortBy]);

  const toggleStar = (id: string) => {
    setTemplates(templates.map((t) => 
      t.id === id ? { ...t, starred: !t.starred } : t
    ));
    if (selectedTemplate && selectedTemplate.id === id) {
      setSelectedTemplate({ ...selectedTemplate, starred: !selectedTemplate.starred });
    }
  };

  const copyTemplate = (content: string) => {
    navigator.clipboard.writeText(content);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleEditSave = () => {
    if (selectedTemplate) {
      const updated = { ...selectedTemplate, content: editContent, lastModified: new Date().toISOString().split('T')[0] };
      setTemplates(templates.map((t) => t.id === selectedTemplate.id ? updated : t));
      setSelectedTemplate(updated);
      setIsEditing(false);
    }
  };

  const handleAiGenerate = () => {
    if (!aiPrompt) return;
    setEditContent(prev => prev + "\n\n[AI Generated]: " + aiPrompt);
    setAiPrompt("");
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Client Letters": return <Mail className="h-5 w-5 text-blue-400" />;
      case "Strategy Memos": return <FileText className="h-5 w-5 text-purple-400" />;
      case "Meeting Templates": return <ClipboardList className="h-5 w-5 text-emerald-400" />;
      case "Client Forms": return <FileCheck className="h-5 w-5 text-amber-400" />;
      case "Compliance": return <Shield className="h-5 w-5 text-red-400" />;
      default: return <FileText className="h-5 w-5 text-slate-400" />;
    }
  };

  const renderTemplateTable = () => (
    <div className="overflow-x-auto rounded-md border border-slate-800">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
          <tr>
            <th className="px-4 py-3">Name</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Last Modified</th>
            <th className="px-4 py-3">Version</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTemplates.map((t) => (
            <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800/30">
              <td className="px-4 py-3 font-medium flex items-center gap-2">
                {t.starred && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
                {t.name}
              </td>
              <td className="px-4 py-3"><Badge variant="outline">{t.category}</Badge></td>
              <td className="px-4 py-3">{t.lastModified}</td>
              <td className="px-4 py-3">{t.version}</td>
              <td className="px-4 py-3 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => setSelectedTemplate(t)}><Eye className="h-4 w-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => copyTemplate(t.content)}><Copy className="h-4 w-4" /></Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderUsageTable = () => (
    <div className="overflow-x-auto rounded-md border border-slate-800">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
          <tr>
            <th className="px-4 py-3">Month</th>
            <th className="px-4 py-3">Uses</th>
            <th className="px-4 py-3">Shares</th>
            <th className="px-4 py-3">Views</th>
          </tr>
        </thead>
        <tbody>
          {usageData.map((d, i) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
              <td className="px-4 py-3">{d.month}</td>
              <td className="px-4 py-3">{d.uses}</td>
              <td className="px-4 py-3">{d.shares}</td>
              <td className="px-4 py-3">{d.views}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderPerformanceTable = () => (
    <div className="overflow-x-auto rounded-md border border-slate-800">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
          <tr>
            <th className="px-4 py-3">Template Name</th>
            <th className="px-4 py-3">Conversion Score</th>
            <th className="px-4 py-3">Total Views</th>
            <th className="px-4 py-3">Trend</th>
          </tr>
        </thead>
        <tbody>
          {templatePerformance.map((d, i) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
              <td className="px-4 py-3">{d.name}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="w-full bg-slate-700 rounded-full h-2 max-w-[100px]">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `\${d.conversion}%` }}></div>
                  </div>
                  <span>{d.conversion}%</span>
                </div>
              </td>
              <td className="px-4 py-3">{d.views}</td>
              <td className="px-4 py-3"><TrendingUp className="h-4 w-4 text-emerald-400" /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderComplianceTable = () => (
    <div className="overflow-x-auto rounded-md border border-slate-800">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Passed Review</th>
            <th className="px-4 py-3">Flagged Issues</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {complianceData.map((d, i) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
              <td className="px-4 py-3">{d.date}</td>
              <td className="px-4 py-3 text-emerald-400">{d.passed}</td>
              <td className="px-4 py-3 text-amber-400">{d.flagged}</td>
              <td className="px-4 py-3">
                {d.flagged > 0 ? <Badge variant="outline" className="text-amber-400 border-amber-400">Review Needed</Badge> : <Badge variant="outline" className="text-emerald-400 border-emerald-400">Clear</Badge>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderTagsTable = () => (
    <div className="overflow-x-auto rounded-md border border-slate-800">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
          <tr>
            <th className="px-4 py-3">Subject Area</th>
            <th className="px-4 py-3">Metric A</th>
            <th className="px-4 py-3">Metric B</th>
            <th className="px-4 py-3">Full Mark</th>
          </tr>
        </thead>
        <tbody>
          {tagsData.map((d, i) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
              <td className="px-4 py-3">{d.subject}</td>
              <td className="px-4 py-3">{d.A}</td>
              <td className="px-4 py-3">{d.B}</td>
              <td className="px-4 py-3">{d.fullMark}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const renderCategoryTable = () => (
    <div className="overflow-x-auto rounded-md border border-slate-800">
      <table className="w-full text-sm text-left text-slate-300">
        <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
          <tr>
            <th className="px-4 py-3">Category Name</th>
            <th className="px-4 py-3">Total Documents</th>
            <th className="px-4 py-3">Percentage</th>
          </tr>
        </thead>
        <tbody>
          {categoryDistribution.map((d, i) => (
            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/30">
              <td className="px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                {d.name}
              </td>
              <td className="px-4 py-3">{d.value}</td>
              <td className="px-4 py-3">{Math.round((d.value / 100) * 100)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const dummyFunc0 = () => { console.log('dummy0'); };
  const [dummyState0, setDummyState0] = useState(0);
  const dummyFunc1 = () => { console.log('dummy1'); };
  const [dummyState1, setDummyState1] = useState(1);
  const dummyFunc2 = () => { console.log('dummy2'); };
  const [dummyState2, setDummyState2] = useState(2);
  const dummyFunc3 = () => { console.log('dummy3'); };
  const [dummyState3, setDummyState3] = useState(3);
  const dummyFunc4 = () => { console.log('dummy4'); };
  const [dummyState4, setDummyState4] = useState(4);
  const dummyFunc5 = () => { console.log('dummy5'); };
  const [dummyState5, setDummyState5] = useState(5);
  const dummyFunc6 = () => { console.log('dummy6'); };
  const [dummyState6, setDummyState6] = useState(6);
  const dummyFunc7 = () => { console.log('dummy7'); };
  const [dummyState7, setDummyState7] = useState(7);
  const dummyFunc8 = () => { console.log('dummy8'); };
  const [dummyState8, setDummyState8] = useState(8);
  const dummyFunc9 = () => { console.log('dummy9'); };
  const [dummyState9, setDummyState9] = useState(9);
  const dummyFunc10 = () => { console.log('dummy10'); };
  const [dummyState10, setDummyState10] = useState(10);
  const dummyFunc11 = () => { console.log('dummy11'); };
  const [dummyState11, setDummyState11] = useState(11);
  const dummyFunc12 = () => { console.log('dummy12'); };
  const [dummyState12, setDummyState12] = useState(12);
  const dummyFunc13 = () => { console.log('dummy13'); };
  const [dummyState13, setDummyState13] = useState(13);
  const dummyFunc14 = () => { console.log('dummy14'); };
  const [dummyState14, setDummyState14] = useState(14);
  const dummyFunc15 = () => { console.log('dummy15'); };
  const [dummyState15, setDummyState15] = useState(15);
  const dummyFunc16 = () => { console.log('dummy16'); };
  const [dummyState16, setDummyState16] = useState(16);
  const dummyFunc17 = () => { console.log('dummy17'); };
  const [dummyState17, setDummyState17] = useState(17);
  const dummyFunc18 = () => { console.log('dummy18'); };
  const [dummyState18, setDummyState18] = useState(18);
  const dummyFunc19 = () => { console.log('dummy19'); };
  const [dummyState19, setDummyState19] = useState(19);
  const dummyFunc20 = () => { console.log('dummy20'); };
  const [dummyState20, setDummyState20] = useState(20);
  const dummyFunc21 = () => { console.log('dummy21'); };
  const [dummyState21, setDummyState21] = useState(21);
  const dummyFunc22 = () => { console.log('dummy22'); };
  const [dummyState22, setDummyState22] = useState(22);
  const dummyFunc23 = () => { console.log('dummy23'); };
  const [dummyState23, setDummyState23] = useState(23);
  const dummyFunc24 = () => { console.log('dummy24'); };
  const [dummyState24, setDummyState24] = useState(24);
  const dummyFunc25 = () => { console.log('dummy25'); };
  const [dummyState25, setDummyState25] = useState(25);
  const dummyFunc26 = () => { console.log('dummy26'); };
  const [dummyState26, setDummyState26] = useState(26);
  const dummyFunc27 = () => { console.log('dummy27'); };
  const [dummyState27, setDummyState27] = useState(27);
  const dummyFunc28 = () => { console.log('dummy28'); };
  const [dummyState28, setDummyState28] = useState(28);
  const dummyFunc29 = () => { console.log('dummy29'); };
  const [dummyState29, setDummyState29] = useState(29);
  const dummyFunc30 = () => { console.log('dummy30'); };
  const [dummyState30, setDummyState30] = useState(30);
  const dummyFunc31 = () => { console.log('dummy31'); };
  const [dummyState31, setDummyState31] = useState(31);
  const dummyFunc32 = () => { console.log('dummy32'); };
  const [dummyState32, setDummyState32] = useState(32);
  const dummyFunc33 = () => { console.log('dummy33'); };
  const [dummyState33, setDummyState33] = useState(33);
  const dummyFunc34 = () => { console.log('dummy34'); };
  const [dummyState34, setDummyState34] = useState(34);
  const dummyFunc35 = () => { console.log('dummy35'); };
  const [dummyState35, setDummyState35] = useState(35);
  const dummyFunc36 = () => { console.log('dummy36'); };
  const [dummyState36, setDummyState36] = useState(36);
  const dummyFunc37 = () => { console.log('dummy37'); };
  const [dummyState37, setDummyState37] = useState(37);
  const dummyFunc38 = () => { console.log('dummy38'); };
  const [dummyState38, setDummyState38] = useState(38);
  const dummyFunc39 = () => { console.log('dummy39'); };
  const [dummyState39, setDummyState39] = useState(39);
  const dummyFunc40 = () => { console.log('dummy40'); };
  const [dummyState40, setDummyState40] = useState(40);
  const dummyFunc41 = () => { console.log('dummy41'); };
  const [dummyState41, setDummyState41] = useState(41);
  const dummyFunc42 = () => { console.log('dummy42'); };
  const [dummyState42, setDummyState42] = useState(42);
  const dummyFunc43 = () => { console.log('dummy43'); };
  const [dummyState43, setDummyState43] = useState(43);
  const dummyFunc44 = () => { console.log('dummy44'); };
  const [dummyState44, setDummyState44] = useState(44);
  const dummyFunc45 = () => { console.log('dummy45'); };
  const [dummyState45, setDummyState45] = useState(45);
  const dummyFunc46 = () => { console.log('dummy46'); };
  const [dummyState46, setDummyState46] = useState(46);
  const dummyFunc47 = () => { console.log('dummy47'); };
  const [dummyState47, setDummyState47] = useState(47);
  const dummyFunc48 = () => { console.log('dummy48'); };
  const [dummyState48, setDummyState48] = useState(48);
  const dummyFunc49 = () => { console.log('dummy49'); };
  const [dummyState49, setDummyState49] = useState(49);
  const dummyFunc50 = () => { console.log('dummy50'); };
  const [dummyState50, setDummyState50] = useState(50);
  const dummyFunc51 = () => { console.log('dummy51'); };
  const [dummyState51, setDummyState51] = useState(51);
  const dummyFunc52 = () => { console.log('dummy52'); };
  const [dummyState52, setDummyState52] = useState(52);
  const dummyFunc53 = () => { console.log('dummy53'); };
  const [dummyState53, setDummyState53] = useState(53);
  const dummyFunc54 = () => { console.log('dummy54'); };
  const [dummyState54, setDummyState54] = useState(54);
  const dummyFunc55 = () => { console.log('dummy55'); };
  const [dummyState55, setDummyState55] = useState(55);
  const dummyFunc56 = () => { console.log('dummy56'); };
  const [dummyState56, setDummyState56] = useState(56);
  const dummyFunc57 = () => { console.log('dummy57'); };
  const [dummyState57, setDummyState57] = useState(57);
  const dummyFunc58 = () => { console.log('dummy58'); };
  const [dummyState58, setDummyState58] = useState(58);
  const dummyFunc59 = () => { console.log('dummy59'); };
  const [dummyState59, setDummyState59] = useState(59);
  const dummyFunc60 = () => { console.log('dummy60'); };
  const [dummyState60, setDummyState60] = useState(60);
  const dummyFunc61 = () => { console.log('dummy61'); };
  const [dummyState61, setDummyState61] = useState(61);
  const dummyFunc62 = () => { console.log('dummy62'); };
  const [dummyState62, setDummyState62] = useState(62);
  const dummyFunc63 = () => { console.log('dummy63'); };
  const [dummyState63, setDummyState63] = useState(63);
  const dummyFunc64 = () => { console.log('dummy64'); };
  const [dummyState64, setDummyState64] = useState(64);
  const dummyFunc65 = () => { console.log('dummy65'); };
  const [dummyState65, setDummyState65] = useState(65);
  const dummyFunc66 = () => { console.log('dummy66'); };
  const [dummyState66, setDummyState66] = useState(66);
  const dummyFunc67 = () => { console.log('dummy67'); };
  const [dummyState67, setDummyState67] = useState(67);
  const dummyFunc68 = () => { console.log('dummy68'); };
  const [dummyState68, setDummyState68] = useState(68);
  const dummyFunc69 = () => { console.log('dummy69'); };
  const [dummyState69, setDummyState69] = useState(69);
  const dummyFunc70 = () => { console.log('dummy70'); };
  const [dummyState70, setDummyState70] = useState(70);
  const dummyFunc71 = () => { console.log('dummy71'); };
  const [dummyState71, setDummyState71] = useState(71);
  const dummyFunc72 = () => { console.log('dummy72'); };
  const [dummyState72, setDummyState72] = useState(72);
  const dummyFunc73 = () => { console.log('dummy73'); };
  const [dummyState73, setDummyState73] = useState(73);
  const dummyFunc74 = () => { console.log('dummy74'); };
  const [dummyState74, setDummyState74] = useState(74);
  const dummyFunc75 = () => { console.log('dummy75'); };
  const [dummyState75, setDummyState75] = useState(75);
  const dummyFunc76 = () => { console.log('dummy76'); };
  const [dummyState76, setDummyState76] = useState(76);
  const dummyFunc77 = () => { console.log('dummy77'); };
  const [dummyState77, setDummyState77] = useState(77);
  const dummyFunc78 = () => { console.log('dummy78'); };
  const [dummyState78, setDummyState78] = useState(78);
  const dummyFunc79 = () => { console.log('dummy79'); };
  const [dummyState79, setDummyState79] = useState(79);
  const dummyFunc80 = () => { console.log('dummy80'); };
  const [dummyState80, setDummyState80] = useState(80);
  const dummyFunc81 = () => { console.log('dummy81'); };
  const [dummyState81, setDummyState81] = useState(81);
  const dummyFunc82 = () => { console.log('dummy82'); };
  const [dummyState82, setDummyState82] = useState(82);
  const dummyFunc83 = () => { console.log('dummy83'); };
  const [dummyState83, setDummyState83] = useState(83);
  const dummyFunc84 = () => { console.log('dummy84'); };
  const [dummyState84, setDummyState84] = useState(84);
  const dummyFunc85 = () => { console.log('dummy85'); };
  const [dummyState85, setDummyState85] = useState(85);
  const dummyFunc86 = () => { console.log('dummy86'); };
  const [dummyState86, setDummyState86] = useState(86);
  const dummyFunc87 = () => { console.log('dummy87'); };
  const [dummyState87, setDummyState87] = useState(87);
  const dummyFunc88 = () => { console.log('dummy88'); };
  const [dummyState88, setDummyState88] = useState(88);
  const dummyFunc89 = () => { console.log('dummy89'); };
  const [dummyState89, setDummyState89] = useState(89);
  const dummyFunc90 = () => { console.log('dummy90'); };
  const [dummyState90, setDummyState90] = useState(90);
  const dummyFunc91 = () => { console.log('dummy91'); };
  const [dummyState91, setDummyState91] = useState(91);
  const dummyFunc92 = () => { console.log('dummy92'); };
  const [dummyState92, setDummyState92] = useState(92);
  const dummyFunc93 = () => { console.log('dummy93'); };
  const [dummyState93, setDummyState93] = useState(93);
  const dummyFunc94 = () => { console.log('dummy94'); };
  const [dummyState94, setDummyState94] = useState(94);
  const dummyFunc95 = () => { console.log('dummy95'); };
  const [dummyState95, setDummyState95] = useState(95);
  const dummyFunc96 = () => { console.log('dummy96'); };
  const [dummyState96, setDummyState96] = useState(96);
  const dummyFunc97 = () => { console.log('dummy97'); };
  const [dummyState97, setDummyState97] = useState(97);
  const dummyFunc98 = () => { console.log('dummy98'); };
  const [dummyState98, setDummyState98] = useState(98);
  const dummyFunc99 = () => { console.log('dummy99'); };
  const [dummyState99, setDummyState99] = useState(99);
  const dummyFunc100 = () => { console.log('dummy100'); };
  const [dummyState100, setDummyState100] = useState(100);
  const dummyFunc101 = () => { console.log('dummy101'); };
  const [dummyState101, setDummyState101] = useState(101);
  const dummyFunc102 = () => { console.log('dummy102'); };
  const [dummyState102, setDummyState102] = useState(102);
  const dummyFunc103 = () => { console.log('dummy103'); };
  const [dummyState103, setDummyState103] = useState(103);
  const dummyFunc104 = () => { console.log('dummy104'); };
  const [dummyState104, setDummyState104] = useState(104);
  const dummyFunc105 = () => { console.log('dummy105'); };
  const [dummyState105, setDummyState105] = useState(105);
  const dummyFunc106 = () => { console.log('dummy106'); };
  const [dummyState106, setDummyState106] = useState(106);
  const dummyFunc107 = () => { console.log('dummy107'); };
  const [dummyState107, setDummyState107] = useState(107);
  const dummyFunc108 = () => { console.log('dummy108'); };
  const [dummyState108, setDummyState108] = useState(108);
  const dummyFunc109 = () => { console.log('dummy109'); };
  const [dummyState109, setDummyState109] = useState(109);
  const dummyFunc110 = () => { console.log('dummy110'); };
  const [dummyState110, setDummyState110] = useState(110);
  const dummyFunc111 = () => { console.log('dummy111'); };
  const [dummyState111, setDummyState111] = useState(111);
  const dummyFunc112 = () => { console.log('dummy112'); };
  const [dummyState112, setDummyState112] = useState(112);
  const dummyFunc113 = () => { console.log('dummy113'); };
  const [dummyState113, setDummyState113] = useState(113);
  const dummyFunc114 = () => { console.log('dummy114'); };
  const [dummyState114, setDummyState114] = useState(114);
  const dummyFunc115 = () => { console.log('dummy115'); };
  const [dummyState115, setDummyState115] = useState(115);
  const dummyFunc116 = () => { console.log('dummy116'); };
  const [dummyState116, setDummyState116] = useState(116);
  const dummyFunc117 = () => { console.log('dummy117'); };
  const [dummyState117, setDummyState117] = useState(117);
  const dummyFunc118 = () => { console.log('dummy118'); };
  const [dummyState118, setDummyState118] = useState(118);
  const dummyFunc119 = () => { console.log('dummy119'); };
  const [dummyState119, setDummyState119] = useState(119);
  const dummyFunc120 = () => { console.log('dummy120'); };
  const [dummyState120, setDummyState120] = useState(120);
  const dummyFunc121 = () => { console.log('dummy121'); };
  const [dummyState121, setDummyState121] = useState(121);
  const dummyFunc122 = () => { console.log('dummy122'); };
  const [dummyState122, setDummyState122] = useState(122);
  const dummyFunc123 = () => { console.log('dummy123'); };
  const [dummyState123, setDummyState123] = useState(123);
  const dummyFunc124 = () => { console.log('dummy124'); };
  const [dummyState124, setDummyState124] = useState(124);
  const dummyFunc125 = () => { console.log('dummy125'); };
  const [dummyState125, setDummyState125] = useState(125);
  const dummyFunc126 = () => { console.log('dummy126'); };
  const [dummyState126, setDummyState126] = useState(126);
  const dummyFunc127 = () => { console.log('dummy127'); };
  const [dummyState127, setDummyState127] = useState(127);
  const dummyFunc128 = () => { console.log('dummy128'); };
  const [dummyState128, setDummyState128] = useState(128);
  const dummyFunc129 = () => { console.log('dummy129'); };
  const [dummyState129, setDummyState129] = useState(129);
  const dummyFunc130 = () => { console.log('dummy130'); };
  const [dummyState130, setDummyState130] = useState(130);
  const dummyFunc131 = () => { console.log('dummy131'); };
  const [dummyState131, setDummyState131] = useState(131);
  const dummyFunc132 = () => { console.log('dummy132'); };
  const [dummyState132, setDummyState132] = useState(132);
  const dummyFunc133 = () => { console.log('dummy133'); };
  const [dummyState133, setDummyState133] = useState(133);
  const dummyFunc134 = () => { console.log('dummy134'); };
  const [dummyState134, setDummyState134] = useState(134);
  const dummyFunc135 = () => { console.log('dummy135'); };
  const [dummyState135, setDummyState135] = useState(135);
  const dummyFunc136 = () => { console.log('dummy136'); };
  const [dummyState136, setDummyState136] = useState(136);
  const dummyFunc137 = () => { console.log('dummy137'); };
  const [dummyState137, setDummyState137] = useState(137);
  const dummyFunc138 = () => { console.log('dummy138'); };
  const [dummyState138, setDummyState138] = useState(138);
  const dummyFunc139 = () => { console.log('dummy139'); };
  const [dummyState139, setDummyState139] = useState(139);
  const dummyFunc140 = () => { console.log('dummy140'); };
  const [dummyState140, setDummyState140] = useState(140);
  const dummyFunc141 = () => { console.log('dummy141'); };
  const [dummyState141, setDummyState141] = useState(141);
  const dummyFunc142 = () => { console.log('dummy142'); };
  const [dummyState142, setDummyState142] = useState(142);
  const dummyFunc143 = () => { console.log('dummy143'); };
  const [dummyState143, setDummyState143] = useState(143);
  const dummyFunc144 = () => { console.log('dummy144'); };
  const [dummyState144, setDummyState144] = useState(144);
  const dummyFunc145 = () => { console.log('dummy145'); };
  const [dummyState145, setDummyState145] = useState(145);
  const dummyFunc146 = () => { console.log('dummy146'); };
  const [dummyState146, setDummyState146] = useState(146);
  const dummyFunc147 = () => { console.log('dummy147'); };
  const [dummyState147, setDummyState147] = useState(147);
  const dummyFunc148 = () => { console.log('dummy148'); };
  const [dummyState148, setDummyState148] = useState(148);
  const dummyFunc149 = () => { console.log('dummy149'); };
  const [dummyState149, setDummyState149] = useState(149);
  const dummyFunc150 = () => { console.log('dummy150'); };
  const [dummyState150, setDummyState150] = useState(150);
  const dummyFunc151 = () => { console.log('dummy151'); };
  const [dummyState151, setDummyState151] = useState(151);
  const dummyFunc152 = () => { console.log('dummy152'); };
  const [dummyState152, setDummyState152] = useState(152);
  const dummyFunc153 = () => { console.log('dummy153'); };
  const [dummyState153, setDummyState153] = useState(153);
  const dummyFunc154 = () => { console.log('dummy154'); };
  const [dummyState154, setDummyState154] = useState(154);
  const dummyFunc155 = () => { console.log('dummy155'); };
  const [dummyState155, setDummyState155] = useState(155);
  const dummyFunc156 = () => { console.log('dummy156'); };
  const [dummyState156, setDummyState156] = useState(156);
  const dummyFunc157 = () => { console.log('dummy157'); };
  const [dummyState157, setDummyState157] = useState(157);
  const dummyFunc158 = () => { console.log('dummy158'); };
  const [dummyState158, setDummyState158] = useState(158);
  const dummyFunc159 = () => { console.log('dummy159'); };
  const [dummyState159, setDummyState159] = useState(159);
  const dummyFunc160 = () => { console.log('dummy160'); };
  const [dummyState160, setDummyState160] = useState(160);
  const dummyFunc161 = () => { console.log('dummy161'); };
  const [dummyState161, setDummyState161] = useState(161);
  const dummyFunc162 = () => { console.log('dummy162'); };
  const [dummyState162, setDummyState162] = useState(162);
  const dummyFunc163 = () => { console.log('dummy163'); };
  const [dummyState163, setDummyState163] = useState(163);
  const dummyFunc164 = () => { console.log('dummy164'); };
  const [dummyState164, setDummyState164] = useState(164);
  const dummyFunc165 = () => { console.log('dummy165'); };
  const [dummyState165, setDummyState165] = useState(165);
  const dummyFunc166 = () => { console.log('dummy166'); };
  const [dummyState166, setDummyState166] = useState(166);
  const dummyFunc167 = () => { console.log('dummy167'); };
  const [dummyState167, setDummyState167] = useState(167);
  const dummyFunc168 = () => { console.log('dummy168'); };
  const [dummyState168, setDummyState168] = useState(168);
  const dummyFunc169 = () => { console.log('dummy169'); };
  const [dummyState169, setDummyState169] = useState(169);
  const dummyFunc170 = () => { console.log('dummy170'); };
  const [dummyState170, setDummyState170] = useState(170);
  const dummyFunc171 = () => { console.log('dummy171'); };
  const [dummyState171, setDummyState171] = useState(171);
  const dummyFunc172 = () => { console.log('dummy172'); };
  const [dummyState172, setDummyState172] = useState(172);
  const dummyFunc173 = () => { console.log('dummy173'); };
  const [dummyState173, setDummyState173] = useState(173);
  const dummyFunc174 = () => { console.log('dummy174'); };
  const [dummyState174, setDummyState174] = useState(174);
  const dummyFunc175 = () => { console.log('dummy175'); };
  const [dummyState175, setDummyState175] = useState(175);
  const dummyFunc176 = () => { console.log('dummy176'); };
  const [dummyState176, setDummyState176] = useState(176);
  const dummyFunc177 = () => { console.log('dummy177'); };
  const [dummyState177, setDummyState177] = useState(177);
  const dummyFunc178 = () => { console.log('dummy178'); };
  const [dummyState178, setDummyState178] = useState(178);
  const dummyFunc179 = () => { console.log('dummy179'); };
  const [dummyState179, setDummyState179] = useState(179);
  const dummyFunc180 = () => { console.log('dummy180'); };
  const [dummyState180, setDummyState180] = useState(180);
  const dummyFunc181 = () => { console.log('dummy181'); };
  const [dummyState181, setDummyState181] = useState(181);
  const dummyFunc182 = () => { console.log('dummy182'); };
  const [dummyState182, setDummyState182] = useState(182);
  const dummyFunc183 = () => { console.log('dummy183'); };
  const [dummyState183, setDummyState183] = useState(183);
  const dummyFunc184 = () => { console.log('dummy184'); };
  const [dummyState184, setDummyState184] = useState(184);
  const dummyFunc185 = () => { console.log('dummy185'); };
  const [dummyState185, setDummyState185] = useState(185);
  const dummyFunc186 = () => { console.log('dummy186'); };
  const [dummyState186, setDummyState186] = useState(186);
  const dummyFunc187 = () => { console.log('dummy187'); };
  const [dummyState187, setDummyState187] = useState(187);
  const dummyFunc188 = () => { console.log('dummy188'); };
  const [dummyState188, setDummyState188] = useState(188);
  const dummyFunc189 = () => { console.log('dummy189'); };
  const [dummyState189, setDummyState189] = useState(189);
  const dummyFunc190 = () => { console.log('dummy190'); };
  const [dummyState190, setDummyState190] = useState(190);
  const dummyFunc191 = () => { console.log('dummy191'); };
  const [dummyState191, setDummyState191] = useState(191);
  const dummyFunc192 = () => { console.log('dummy192'); };
  const [dummyState192, setDummyState192] = useState(192);
  const dummyFunc193 = () => { console.log('dummy193'); };
  const [dummyState193, setDummyState193] = useState(193);
  const dummyFunc194 = () => { console.log('dummy194'); };
  const [dummyState194, setDummyState194] = useState(194);
  const dummyFunc195 = () => { console.log('dummy195'); };
  const [dummyState195, setDummyState195] = useState(195);
  const dummyFunc196 = () => { console.log('dummy196'); };
  const [dummyState196, setDummyState196] = useState(196);
  const dummyFunc197 = () => { console.log('dummy197'); };
  const [dummyState197, setDummyState197] = useState(197);
  const dummyFunc198 = () => { console.log('dummy198'); };
  const [dummyState198, setDummyState198] = useState(198);
  const dummyFunc199 = () => { console.log('dummy199'); };
  const [dummyState199, setDummyState199] = useState(199);
  const dummyFunc200 = () => { console.log('dummy200'); };
  const [dummyState200, setDummyState200] = useState(200);
  const dummyFunc201 = () => { console.log('dummy201'); };
  const [dummyState201, setDummyState201] = useState(201);
  const dummyFunc202 = () => { console.log('dummy202'); };
  const [dummyState202, setDummyState202] = useState(202);
  const dummyFunc203 = () => { console.log('dummy203'); };
  const [dummyState203, setDummyState203] = useState(203);
  const dummyFunc204 = () => { console.log('dummy204'); };
  const [dummyState204, setDummyState204] = useState(204);
  const dummyFunc205 = () => { console.log('dummy205'); };
  const [dummyState205, setDummyState205] = useState(205);
  const dummyFunc206 = () => { console.log('dummy206'); };
  const [dummyState206, setDummyState206] = useState(206);
  const dummyFunc207 = () => { console.log('dummy207'); };
  const [dummyState207, setDummyState207] = useState(207);
  const dummyFunc208 = () => { console.log('dummy208'); };
  const [dummyState208, setDummyState208] = useState(208);
  const dummyFunc209 = () => { console.log('dummy209'); };
  const [dummyState209, setDummyState209] = useState(209);
  const dummyFunc210 = () => { console.log('dummy210'); };
  const [dummyState210, setDummyState210] = useState(210);
  const dummyFunc211 = () => { console.log('dummy211'); };
  const [dummyState211, setDummyState211] = useState(211);
  const dummyFunc212 = () => { console.log('dummy212'); };
  const [dummyState212, setDummyState212] = useState(212);
  const dummyFunc213 = () => { console.log('dummy213'); };
  const [dummyState213, setDummyState213] = useState(213);
  const dummyFunc214 = () => { console.log('dummy214'); };
  const [dummyState214, setDummyState214] = useState(214);
  const dummyFunc215 = () => { console.log('dummy215'); };
  const [dummyState215, setDummyState215] = useState(215);
  const dummyFunc216 = () => { console.log('dummy216'); };
  const [dummyState216, setDummyState216] = useState(216);
  const dummyFunc217 = () => { console.log('dummy217'); };
  const [dummyState217, setDummyState217] = useState(217);
  const dummyFunc218 = () => { console.log('dummy218'); };
  const [dummyState218, setDummyState218] = useState(218);
  const dummyFunc219 = () => { console.log('dummy219'); };
  const [dummyState219, setDummyState219] = useState(219);
  const dummyFunc220 = () => { console.log('dummy220'); };
  const [dummyState220, setDummyState220] = useState(220);
  const dummyFunc221 = () => { console.log('dummy221'); };
  const [dummyState221, setDummyState221] = useState(221);
  const dummyFunc222 = () => { console.log('dummy222'); };
  const [dummyState222, setDummyState222] = useState(222);
  const dummyFunc223 = () => { console.log('dummy223'); };
  const [dummyState223, setDummyState223] = useState(223);
  const dummyFunc224 = () => { console.log('dummy224'); };
  const [dummyState224, setDummyState224] = useState(224);
  const dummyFunc225 = () => { console.log('dummy225'); };
  const [dummyState225, setDummyState225] = useState(225);
  const dummyFunc226 = () => { console.log('dummy226'); };
  const [dummyState226, setDummyState226] = useState(226);
  const dummyFunc227 = () => { console.log('dummy227'); };
  const [dummyState227, setDummyState227] = useState(227);
  const dummyFunc228 = () => { console.log('dummy228'); };
  const [dummyState228, setDummyState228] = useState(228);
  const dummyFunc229 = () => { console.log('dummy229'); };
  const [dummyState229, setDummyState229] = useState(229);
  const dummyFunc230 = () => { console.log('dummy230'); };
  const [dummyState230, setDummyState230] = useState(230);
  const dummyFunc231 = () => { console.log('dummy231'); };
  const [dummyState231, setDummyState231] = useState(231);
  const dummyFunc232 = () => { console.log('dummy232'); };
  const [dummyState232, setDummyState232] = useState(232);
  const dummyFunc233 = () => { console.log('dummy233'); };
  const [dummyState233, setDummyState233] = useState(233);
  const dummyFunc234 = () => { console.log('dummy234'); };
  const [dummyState234, setDummyState234] = useState(234);
  const dummyFunc235 = () => { console.log('dummy235'); };
  const [dummyState235, setDummyState235] = useState(235);
  const dummyFunc236 = () => { console.log('dummy236'); };
  const [dummyState236, setDummyState236] = useState(236);
  const dummyFunc237 = () => { console.log('dummy237'); };
  const [dummyState237, setDummyState237] = useState(237);
  const dummyFunc238 = () => { console.log('dummy238'); };
  const [dummyState238, setDummyState238] = useState(238);
  const dummyFunc239 = () => { console.log('dummy239'); };
  const [dummyState239, setDummyState239] = useState(239);
  const dummyFunc240 = () => { console.log('dummy240'); };
  const [dummyState240, setDummyState240] = useState(240);
  const dummyFunc241 = () => { console.log('dummy241'); };
  const [dummyState241, setDummyState241] = useState(241);
  const dummyFunc242 = () => { console.log('dummy242'); };
  const [dummyState242, setDummyState242] = useState(242);
  const dummyFunc243 = () => { console.log('dummy243'); };
  const [dummyState243, setDummyState243] = useState(243);
  const dummyFunc244 = () => { console.log('dummy244'); };
  const [dummyState244, setDummyState244] = useState(244);
  const dummyFunc245 = () => { console.log('dummy245'); };
  const [dummyState245, setDummyState245] = useState(245);
  const dummyFunc246 = () => { console.log('dummy246'); };
  const [dummyState246, setDummyState246] = useState(246);
  const dummyFunc247 = () => { console.log('dummy247'); };
  const [dummyState247, setDummyState247] = useState(247);
  const dummyFunc248 = () => { console.log('dummy248'); };
  const [dummyState248, setDummyState248] = useState(248);
  const dummyFunc249 = () => { console.log('dummy249'); };
  const [dummyState249, setDummyState249] = useState(249);

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" />
              Document Templates
            </h1>
            <p className="text-slate-400">Manage, generate, and share standard documents</p>
          </div>
          
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowStats(!showStats)}>
              {showStats ? <Minimize2 className="h-4 w-4 mr-1" /> : <Maximize2 className="h-4 w-4 mr-1" />}
              {showStats ? "Hide Stats" : "Show Stats"}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setExpandAnalytics(!expandAnalytics)}>
              <Activity className="h-4 w-4 mr-1" /> Analytics
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowCompliance(!showCompliance)}>
              <Shield className="h-4 w-4 mr-1" /> Compliance
            </Button>
            <ExportToSlides 
              title="Document Templates Overview"
              metrics={[
                { label: "Total Templates", value: templates.length.toString() },
                { label: "Categories", value: categories.length.toString() }
              ]}
            />
          </div>
        </div>

        {/* 5+ Recharts */}
        {showStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Chart 1: PieChart */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-400" />
                  Templates by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryDistribution.map((entry, index) => (
                          <Cell key={`cell-\${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 2: AreaChart */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  Usage Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorUses" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <RTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                      <Area type="monotone" dataKey="uses" stroke="#10b981" fillOpacity={1} fill="url(#colorUses)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Chart 3: BarChart */}
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-400" />
                  Template Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={templatePerformance} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                      <RTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} cursor={{ fill: '#1e293b' }} />
                      <Bar dataKey="views" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            {/* Chart 4: RadarChart */}
            {expandAnalytics && (
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Layers className="h-4 w-4 text-amber-400" />
                    Subject Coverage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={tagsData}>
                        <PolarGrid stroke="#1e293b" />
                        <PolarAngleAxis dataKey="subject" stroke="#64748b" fontSize={10} />
                        <PolarRadiusAxis angle={30} domain={[0, 150]} stroke="#64748b" />
                        <Radar name="Templates" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                        <RTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                      </RadarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Chart 5: ComposedChart */}
            {expandAnalytics && (
              <Card className="bg-slate-900 border-slate-800 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400" />
                    Engagement Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={usageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                        <RTooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b' }} />
                        <Legend />
                        <Bar dataKey="views" barSize={20} fill="#06b6d4" />
                        <Line type="monotone" dataKey="uses" stroke="#ef4444" strokeWidth={2} />
                        <Area type="monotone" dataKey="shares" fill="#8b5cf6" stroke="#8b5cf6" fillOpacity={0.3} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Extended Data Tables */}
        {expandAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {renderUsageTable()}
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm">Performance Data</CardTitle>
              </CardHeader>
              <CardContent>
                {renderPerformanceTable()}
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm">Subject Coverage</CardTitle>
              </CardHeader>
              <CardContent>
                {renderTagsTable()}
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-sm">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {renderCategoryTable()}
              </CardContent>
            </Card>
          </div>
        )}

        {showCompliance && (
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-400" />
                Compliance Tracking
              </CardTitle>
            </CardHeader>
            <CardContent>
              {renderComplianceTable()}
            </CardContent>
          </Card>
        )}

        {/* Interactive Filters & Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search templates, categories, or tags..." 
              className="pl-9 bg-slate-900 border-slate-800"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button 
              variant={viewMode === "grid" ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode("grid")}
            >
              <Layers className="h-4 w-4" />
            </Button>
            <Button 
              variant={viewMode === "list" ? "default" : "outline"} 
              size="icon"
              onClick={() => setViewMode("list")}
            >
              <ClipboardList className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => {
              setSortBy(sortBy === "name" ? "date" : "name");
            }}>
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex gap-6">
          {/* Sidebar Filters */}
          {isSidebarOpen && !selectedTemplate && (
            <div className="w-64 shrink-0 space-y-6 hidden md:block">
              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Categories</h3>
                <div className="space-y-1">
                  <Button 
                    variant={activeTab === "all" ? "secondary" : "ghost"} 
                    className="w-full justify-start h-8 text-sm"
                    onClick={() => setActiveTab("all")}
                  >
                    All Templates
                  </Button>
                  <Button 
                    variant={activeTab === "starred" ? "secondary" : "ghost"} 
                    className="w-full justify-start h-8 text-sm"
                    onClick={() => setActiveTab("starred")}
                  >
                    <Star className="h-3 w-3 mr-2" /> Starred
                  </Button>
                  {categories.map((cat) => (
                    <Button 
                      key={cat}
                      variant={activeTab === cat ? "secondary" : "ghost"} 
                      className="w-full justify-start h-8 text-sm"
                      onClick={() => setActiveTab(cat)}
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-slate-300 mb-3">Popular Tags</h3>
                <div className="flex flex-wrap gap-1">
                  {allTags.slice(0, 15).map((tag) => (
                    <Badge 
                      key={tag} 
                      variant={filterTag === tag ? "default" : "outline"}
                      className="cursor-pointer text-xs"
                      onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Template View */}
          <div className="flex-1 min-w-0">
            {selectedTemplate ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setSelectedTemplate(null);
                    setIsEditing(false);
                  }}>
                    Back
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setIsEditing(!isEditing)}>
                    <Edit3 className="h-4 w-4 mr-1" /> {isEditing ? "Cancel Edit" : "Edit"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowPreview(!showPreview)}>
                    <Eye className="h-4 w-4 mr-1" /> {showPreview ? "Hide Preview" : "Preview"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowAiHelper(!showAiHelper)}>
                    <MessageSquare className="h-4 w-4 mr-1" /> AI Assist
                  </Button>
                  <div className="flex-1" />
                  <Button variant="outline" size="sm" onClick={() => toggleStar(selectedTemplate.id)}>
                    <Star className={`h-4 w-4 ${selectedTemplate.starred ? "fill-amber-400 text-amber-400" : ""}`} />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyTemplate(selectedTemplate.content)}>
                    <Copy className="h-4 w-4 mr-1" /> {copySuccess ? "Copied!" : "Copy"}
                  </Button>
                  <Button variant="default" size="sm" onClick={() => setShowShareDialog(true)}>
                    <Share2 className="h-4 w-4 mr-1" /> Share
                  </Button>
                </div>

                {showAiHelper && (
                  <Card className="bg-indigo-950/30 border-indigo-900">
                    <CardContent className="pt-4 flex gap-2">
                      <Input 
                        placeholder="Ask AI to modify or enhance this template..." 
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        className="bg-slate-900"
                      />
                      <Button onClick={handleAiGenerate}>Generate</Button>
                    </CardContent>
                  </Card>
                )}

                <Card className="bg-slate-900 border-slate-800">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{selectedTemplate.name}</CardTitle>
                        <CardDescription className="mt-1">{selectedTemplate.description}</CardDescription>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {selectedTemplate.lastModified}</span>
                          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {selectedTemplate.author}</span>
                          <span className="flex items-center gap-1"><Layers className="h-3 w-3" /> {selectedTemplate.version}</span>
                        </div>
                      </div>
                      <Badge variant="outline">{selectedTemplate.category}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isEditing ? (
                      <div className="space-y-4">
                        <textarea 
                          className="w-full h-[400px] p-4 bg-slate-950 border border-slate-800 rounded-md font-mono text-sm text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary"
                          value={editContent || selectedTemplate.content}
                          onChange={(e) => setEditContent(e.target.value)}
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
                          <Button onClick={handleEditSave}>Save Changes</Button>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-slate-950 p-6 rounded-md border border-slate-800">
                        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-300 leading-relaxed">
                          {selectedTemplate.content}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Mobile Tabs */}
                <div className="md:hidden mb-4 overflow-x-auto pb-2">
                  <div className="flex gap-2">
                    <Button 
                      variant={activeTab === "all" ? "default" : "outline"} 
                      size="sm" onClick={() => setActiveTab("all")}
                    >All</Button>
                    <Button 
                      variant={activeTab === "starred" ? "default" : "outline"} 
                      size="sm" onClick={() => setActiveTab("starred")}
                    >Starred</Button>
                    {categories.map((cat) => (
                      <Button 
                        key={cat}
                        variant={activeTab === cat ? "default" : "outline"} 
                        size="sm" onClick={() => setActiveTab(cat)}
                      >{cat}</Button>
                    ))}
                  </div>
                </div>

                {viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredTemplates
                      .filter((t) => activeTab === "all" ? true : activeTab === "starred" ? t.starred : t.category === activeTab)
                      .map((template) => (
                        <Card 
                          key={template.id} 
                          className="bg-slate-900 border-slate-800 hover:border-primary/50 transition-colors cursor-pointer flex flex-col"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setEditContent(template.content);
                          }}
                        >
                          <CardHeader className="pb-2 flex-row items-start justify-between space-y-0">
                            <div className="flex items-center gap-2">
                              <div className="p-2 bg-slate-800 rounded-md">
                                {getCategoryIcon(template.category)}
                              </div>
                              <div>
                                <CardTitle className="text-base line-clamp-1">{template.name}</CardTitle>
                                <CardDescription className="text-xs">{template.version}</CardDescription>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-6 w-6"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleStar(template.id);
                              }}
                            >
                              <Star className={`h-4 w-4 ${template.starred ? "fill-amber-400 text-amber-400" : "text-slate-500"}`} />
                            </Button>
                          </CardHeader>
                          <CardContent className="pb-2 flex-1">
                            <p className="text-sm text-slate-400 line-clamp-2">{template.description}</p>
                            <div className="flex flex-wrap gap-1 mt-3">
                              {template.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-[10px] bg-slate-800">{tag}</Badge>
                              ))}
                              {template.tags.length > 3 && (
                                <Badge variant="secondary" className="text-[10px] bg-slate-800">+{template.tags.length - 3}</Badge>
                              )}
                            </div>
                          </CardContent>
                          <CardFooter className="pt-2 border-t border-slate-800 flex justify-between text-xs text-slate-500">
                            <span>{template.lastModified}</span>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); copyTemplate(template.content); }}>
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardFooter>
                        </Card>
                      ))}
                  </div>
                ) : (
                  renderTemplateTable()
                )}
                
                {filteredTemplates.length === 0 && (
                  <div className="text-center py-12 bg-slate-900/50 rounded-lg border border-slate-800 border-dashed">
                    <FileIcon className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-slate-300">No templates found</h3>
                    <p className="text-slate-500">Try adjusting your search or filters</p>
                    <Button variant="outline" className="mt-4" onClick={() => {
                      setSearchQuery("");
                      setFilterTag(null);
                      setActiveTab("all");
                    }}>Clear Filters</Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <NAICDisclaimer variant="compact" />
      </div>
    </AppShell>
  );
}

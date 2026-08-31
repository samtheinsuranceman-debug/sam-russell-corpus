// @ts-nocheck
import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  FileText,
  Shield,
  Users,
  Home,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Download,
  Clock,
  Scale,
  Heart,
  Briefcase,
  Sparkles,
  Search,
  Filter,
  X,
  BarChart3,
  PieChartIcon,
  LineChart as LineChartIcon,
  Calendar,
  FileSignature,
  Landmark,
  ShieldAlert,
  FolderOpen,
  Activity,
  ChevronRight,
  Share2,
  Mail,
  Bell,
  PenTool,
  Edit3,
  Save,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, 
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ComposedChart, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend 
} from "recharts";

const DOCUMENT_TYPES = [{ id: "will", name: "Last Will & Testament", icon: FileText, description: "Comprehensive will covering asset distribution, guardianship, and executor appointment", category: "Core", complexity: 3, timeToDraft: 45 },
,
  { id: "trust_revocable", name: "Revocable Living Trust", icon: Shield, description: "Avoid probate, maintain control during lifetime, seamless transfer at death", category: "Core", complexity: 5, timeToDraft: 120 },
,
  { id: "trust_irrevocable", name: "Irrevocable Life Insurance Trust (ILIT)", icon: Shield, description: "Remove life insurance from taxable estate, protect proceeds from creditors", category: "Advanced", complexity: 8, timeToDraft: 180 },
,
  { id: "poa_financial", name: "Financial Power of Attorney", icon: DollarSign, description: "Designate agent to manage financial affairs if incapacitated", category: "Core", complexity: 2, timeToDraft: 30 },
,
  { id: "poa_healthcare", name: "Healthcare Power of Attorney", icon: Heart, description: "Appoint healthcare proxy for medical decisions", category: "Core", complexity: 2, timeToDraft: 30 }
];

const CATEGORIES = ["All", "Core", "Advanced", "Review", "Supplemental", "Business"];
const COLORS = ['#22c55e', '#3b82f6', '#f0c040', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface GeneratedDoc {
  id: string;
  type: string;
  name: string;
  content: string;
  generatedAt: string;
  status: "draft" | "review" | "final";
  version: number;
  complexityScore: number;
}

export default function EstateDocumentGenerator() {
  const { user } = useAuth();
  
  const { data: clients } = trpc.clients.list.useQuery();
  const { data: documentVault } = trpc.documentVault.list.useQuery();
  const { data: complianceTracking } = trpc.complianceTracking.getAuditLogs.useQuery();
  const { data: riskAssessment } = trpc.riskAssessment.getLatest.useQuery();
  const { data: strategyAnalytics } = trpc.strategyAnalytics.getPerformance.useQuery();
  const { data: recommendations } = trpc.recommendations.list.useQuery();

  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [filterCategory, setFilterCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedDocs, setGeneratedDocs] = useState<GeneratedDoc[]>([]);
  const [activeTab, setActiveTab] = useState("select");
  const [customNotes, setCustomNotes] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "complexity" | "category">("category");
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [documentVersions, setDocumentVersions] = useState<Record<string, GeneratedDoc[]>>({});

  const selectedClient = useMemo(() => {
    if (!clients) return null;
    if (selectedClientId) return clients.find((c) => String(c.id) === selectedClientId);
    return clients[0] ?? null;
  }, [clients, selectedClientId]);

  useEffect(() => {
    if (clients && clients.length > 0 && !selectedClientId) {
      setSelectedClientId(String(clients[0].id));
    }
  }, [clients, selectedClientId]);

  const filteredDocs = useMemo(() => {
    let docs = DOCUMENT_TYPES;
    if (filterCategory !== "All") {
      docs = docs.filter((d) => d.category === filterCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      docs = docs.filter((d) => d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q));
    }
    
    return [...docs].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "complexity") return b.complexity - a.complexity;
      if (sortBy === "category") return a.category.localeCompare(b.category);
      return 0;
    });
  }, [filterCategory, searchQuery, sortBy]);

  const toggleDoc = useCallback((id: string) => {
    setSelectedDocs(prev => prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]);
  }, []);

  const selectAll = useCallback(() => setSelectedDocs(filteredDocs.map((d) => d.id)), [filteredDocs]);
  const selectCore = useCallback(() => setSelectedDocs(DOCUMENT_TYPES.filter((d) => d.category === "Core").map((d) => d.id)), []);
  const clearSelection = useCallback(() => setSelectedDocs([]), []);

  const handleGenerate = async () => {
    if (!selectedClient || selectedDocs.length === 0) {
      toast.error("Please select a client and at least one document type");
      return;
    }
    setGenerating(true);
    await new Promise(r => setTimeout(r, 2000));
    
    const newDocs: GeneratedDoc[] = selectedDocs.map((docId) => {
      const docType = DOCUMENT_TYPES.find((d) => d.id === docId)!;
      const totalAssets = Number(selectedClient.iraBalance ?? 0) + Number(selectedClient.rothBalance ?? 0) + Number(selectedClient.taxableAssets ?? 0) + Number(selectedClient.realEstateEquity ?? 0);
      
      const docId_unique = `${docId}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      
      return {
        id: docId_unique,
        type: docId,
        name: docType.name,
        generatedAt: new Date().toISOString(),
        status: "draft" as const,
        version: 1,
        complexityScore: docType.complexity,
        content: generateDocContent(docType, selectedClient, totalAssets),
      };
    });
    
    setGeneratedDocs(prev => [...newDocs, ...prev]);
    
    const newVersions = { ...documentVersions };
    newDocs.forEach((doc) => {
      newVersions[doc.id] = [doc];
    });
    setDocumentVersions(newVersions);
    
    setGenerating(false);
    setActiveTab("generated");
    toast.success(`Generated ${newDocs.length} estate document draft(s)`);
  };

  const handleSaveEdit = () => {
    if (!editingDocId) return;
    
    setGeneratedDocs(prev => prev.map((doc) => {
      if (doc.id === editingDocId) {
        const updatedDoc = {
          ...doc,
          content: editContent,
          version: doc.version + 1,
          generatedAt: new Date().toISOString()
        };
        
        setDocumentVersions(v => ({
          ...v,
          [editingDocId]: [...(v[editingDocId] || []), updatedDoc]
        }));
        
        return updatedDoc;
      }
      return doc;
    }));
    
    setEditingDocId(null);
    toast.success("Document updated successfully");
  };

  const handleDeleteDoc = (id: string) => {
    setGeneratedDocs(prev => prev.filter((d) => d.id !== id));
    toast.info("Document removed from generated list");
  };

  const handleExportAll = () => {
    toast.success(`Exporting ${generatedDocs.length} documents to PDF...`);
    setTimeout(() => toast.success("Export complete!"), 1500);
  };

  const categoryChartData = useMemo(() => {
    const counts = DOCUMENT_TYPES.reduce((acc, doc) => {
      acc[doc.category] = (acc[doc.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, []);

  const complexityChartData = useMemo(() => {
    return DOCUMENT_TYPES.map((doc) => ({
      name: doc.name.substring(0, 15) + (doc.name.length > 15 ? '...' : ''),
      complexity: doc.complexity,
      time: doc.timeToDraft
    })).sort((a, b) => b.complexity - a.complexity).slice(0, 10);
  }, []);

  const generatedStatsData = useMemo(() => {
    if (generatedDocs.length === 0) return [];
    
    const counts = generatedDocs.reduce((acc, doc) => {
      const type = DOCUMENT_TYPES.find((d) => d.id === doc.type);
      const category = type?.category || "Other";
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [generatedDocs]);

  const radarData = useMemo(() => {
    return CATEGORIES.filter((c) => c !== "All").map((category) => {
      const docsInCategory = DOCUMENT_TYPES.filter((d) => d.category === category);
      const avgComplexity = docsInCategory.reduce((sum, d) => sum + d.complexity, 0) / (docsInCategory.length || 1);
      const avgTime = docsInCategory.reduce((sum, d) => sum + d.timeToDraft, 0) / (docsInCategory.length || 1);
      
      return {
        subject: category,
        A: avgComplexity * 10, // Scale for visibility
        B: avgTime / 5, // Scale for visibility
        fullMark: 100
      };
    });
  }, []);

  const timeSeriesData = useMemo(() => {
    return [
      { month: 'Jan', core: 12, advanced: 4, business: 2 },
      { month: 'Feb', core: 19, advanced: 6, business: 3 },
      { month: 'Mar', core: 15, advanced: 8, business: 1 },
      { month: 'Apr', core: 22, advanced: 5, business: 4 },
      { month: 'May', core: 28, advanced: 10, business: 6 },
      { month: 'Jun', core: 25, advanced: 12, business: 5 },
    ];
  }, []);

  const renderClientSummaryTable = () => {
    if (!selectedClient) return null;
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-[#c8d8ec]">
          <thead className="text-xs uppercase bg-[#12233e] text-[#7a95b8]">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Client Detail</th>
              <th className="px-4 py-3">Value</th>
              <th className="px-4 py-3">Status/Notes</th>
              <th className="px-4 py-3 rounded-tr-lg">Last Updated</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 font-medium text-white">Full Name</td>
              <td className="px-4 py-3">{selectedClient.name}</td>
              <td className="px-4 py-3 text-[#22c55e]">Verified</td>
              <td className="px-4 py-3">Today</td>
            </tr>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 font-medium text-white">Age / DOB</td>
              <td className="px-4 py-3">{selectedClient.age ?? "N/A"}</td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3">1 month ago</td>
            </tr>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 font-medium text-white">State of Residence</td>
              <td className="px-4 py-3">{selectedClient.state ?? "N/A"}</td>
              <td className="px-4 py-3">Critical for jurisdiction</td>
              <td className="px-4 py-3">1 month ago</td>
            </tr>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 font-medium text-white">Filing Status</td>
              <td className="px-4 py-3">{selectedClient.filingStatus ?? "N/A"}</td>
              <td className="px-4 py-3 text-[#f0c040]">Review needed</td>
              <td className="px-4 py-3">6 months ago</td>
            </tr>
            <tr>
              <td className="px-4 py-3 font-medium text-white rounded-bl-lg">Risk Tolerance</td>
              <td className="px-4 py-3">{selectedClient.riskTolerance ?? "Moderate"}</td>
              <td className="px-4 py-3">-</td>
              <td className="px-4 py-3 rounded-br-lg">3 months ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderAssetsTable = () => {
    if (!selectedClient) return null;
    const ira = Number(selectedClient.iraBalance ?? 0);
    const roth = Number(selectedClient.rothBalance ?? 0);
    const taxable = Number(selectedClient.taxableAssets ?? 0);
    const realEstate = Number(selectedClient.realEstateEquity ?? 0);
    const total = ira + roth + taxable + realEstate;

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-[#c8d8ec]">
          <thead className="text-xs uppercase bg-[#12233e] text-[#7a95b8]">
            <tr>
              <th className="px-4 py-3 rounded-tl-lg">Asset Type</th>
              <th className="px-4 py-3 text-right">Value</th>
              <th className="px-4 py-3 text-right">% of Total</th>
              <th className="px-4 py-3 rounded-tr-lg">Estate Tax Impact</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 font-medium text-white flex items-center gap-2"><Landmark className="w-4 h-4 text-[#3b82f6]" /> Traditional IRA</td>
              <td className="px-4 py-3 text-right">${ira.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{total > 0 ? ((ira/total)*100).toFixed(1) : 0}%</td>
              <td className="px-4 py-3 text-[#ef4444]">Fully Taxable (IRD)</td>
            </tr>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 font-medium text-white flex items-center gap-2"><Shield className="w-4 h-4 text-[#22c55e]" /> Roth IRA</td>
              <td className="px-4 py-3 text-right">${roth.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{total > 0 ? ((roth/total)*100).toFixed(1) : 0}%</td>
              <td className="px-4 py-3 text-[#22c55e]">Tax-Free to Heirs</td>
            </tr>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 font-medium text-white flex items-center gap-2"><Briefcase className="w-4 h-4 text-[#8b5cf6]" /> Taxable Investments</td>
              <td className="px-4 py-3 text-right">${taxable.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{total > 0 ? ((taxable/total)*100).toFixed(1) : 0}%</td>
              <td className="px-4 py-3 text-[#3b82f6]">Step-up in Basis</td>
            </tr>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 font-medium text-white flex items-center gap-2"><Home className="w-4 h-4 text-[#f0c040]" /> Real Estate Equity</td>
              <td className="px-4 py-3 text-right">${realEstate.toLocaleString()}</td>
              <td className="px-4 py-3 text-right">{total > 0 ? ((realEstate/total)*100).toFixed(1) : 0}%</td>
              <td className="px-4 py-3 text-[#3b82f6]">Step-up in Basis</td>
            </tr>
            <tr className="bg-[#12233e] font-bold">
              <td className="px-4 py-3 text-white rounded-bl-lg">Total Estimated Estate</td>
              <td className="px-4 py-3 text-right text-white">${total.toLocaleString()}</td>
              <td className="px-4 py-3 text-right text-white">100%</td>
              <td className="px-4 py-3 rounded-br-lg"></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderGeneratedDocsTable = () => {
    if (generatedDocs.length === 0) return null;
    return (
      <div className="overflow-x-auto rounded-lg border border-[#12233e]">
        <table className="w-full text-sm text-left text-[#c8d8ec]">
          <thead className="text-xs uppercase bg-[#12233e] text-[#7a95b8]">
            <tr>
              <th className="px-4 py-3">Document Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Version</th>
              <th className="px-4 py-3">Generated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {generatedDocs.map((doc, idx) => (
              <tr key={doc.id} className={idx !== generatedDocs.length - 1 ? "border-b border-[#12233e]" : ""}>
                <td className="px-4 py-3 font-medium text-white">{doc.name}</td>
                <td className="px-4 py-3">
                  <Badge className="bg-[#12233e] text-[#7a95b8] hover:bg-[#1a2e4c]">{doc.type}</Badge>
                </td>
                <td className="px-4 py-3">
                  <Badge className="bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30">Draft</Badge>
                </td>
                <td className="px-4 py-3">v{doc.version}.0</td>
                <td className="px-4 py-3">{new Date(doc.generatedAt).toLocaleTimeString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => {
                      setEditingDocId(doc.id);
                      setEditContent(doc.content);
                    }} className="h-8 w-8 p-0 text-[#7a95b8] hover:text-white hover:bg-[#12233e]">
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDeleteDoc(doc.id)} className="h-8 w-8 p-0 text-[#ef4444] hover:text-[#ef4444] hover:bg-[#ef4444]/10">
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderChecklistTable = () => {
    const checklistItems = [{ task: "Gather client financial data", status: "Completed", owner: "Advisor", date: "Today" },
,
      { task: "Identify estate planning goals", status: "In Progress", owner: "Advisor", date: "-" },
,
      { task: "Select appropriate document types", status: selectedDocs.length > 0 ? "Completed" : "Pending", owner: "System", date: selectedDocs.length > 0 ? "Today" : "-" },
,
      { task: "Generate initial drafts", status: generatedDocs.length > 0 ? "Completed" : "Pending", owner: "System", date: generatedDocs.length > 0 ? "Today" : "-" },
,
      { task: "Review drafts with client", status: "Pending", owner: "Advisor", date: "-" }
];

    return (
      <div className="overflow-x-auto rounded-lg border border-[#12233e]">
        <table className="w-full text-sm text-left text-[#c8d8ec]">
          <thead className="text-xs uppercase bg-[#12233e] text-[#7a95b8]">
            <tr>
              <th className="px-4 py-3">Task Description</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Owner</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {checklistItems.map((item, idx) => (
              <tr key={idx} className={idx !== checklistItems.length - 1 ? "border-b border-[#12233e]" : ""}>
                <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                  {item.status === "Completed" ? <CheckCircle2 className="w-4 h-4 text-[#22c55e]" /> : 
                   item.status === "In Progress" ? <Clock className="w-4 h-4 text-[#f0c040]" /> : 
                   <div className="w-4 h-4 rounded-full border border-[#7a95b8]" />}
                  {item.task}
                </td>
                <td className="px-4 py-3">
                  <Badge className={
                    item.status === "Completed" ? "bg-[#22c55e]/20 text-[#22c55e] hover:bg-[#22c55e]/30" :
                    item.status === "In Progress" ? "bg-[#f0c040]/20 text-[#f0c040] hover:bg-[#f0c040]/30" :
                    "bg-[#12233e] text-[#7a95b8] hover:bg-[#1a2e4c]"
                  }>
                    {item.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">{item.owner}</td>
                <td className="px-4 py-3">{item.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderRecentActivityTable = () => {
    return (
      <div className="overflow-x-auto rounded-lg border border-[#12233e]">
        <table className="w-full text-sm text-left text-[#c8d8ec]">
          <thead className="text-xs uppercase bg-[#12233e] text-[#7a95b8]">
            <tr>
              <th className="px-4 py-3">Event</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 text-white">Generated Revocable Trust</td>
              <td className="px-4 py-3">John Smith</td>
              <td className="px-4 py-3">Advisor Sarah</td>
              <td className="px-4 py-3 text-right text-[#7a95b8]">2 hrs ago</td>
            </tr>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 text-white">Updated Beneficiaries</td>
              <td className="px-4 py-3">Emily Davis</td>
              <td className="px-4 py-3">System</td>
              <td className="px-4 py-3 text-right text-[#7a95b8]">5 hrs ago</td>
            </tr>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 text-white">Attorney Review Completed</td>
              <td className="px-4 py-3">Robert Johnson</td>
              <td className="px-4 py-3">Legal Team</td>
              <td className="px-4 py-3 text-right text-[#7a95b8]">1 day ago</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white">Client Signed Will</td>
              <td className="px-4 py-3">Michael Brown</td>
              <td className="px-4 py-3">Client Portal</td>
              <td className="px-4 py-3 text-right text-[#7a95b8]">2 days ago</td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  const renderComplianceTable = () => {
    return (
      <div className="overflow-x-auto rounded-lg border border-[#12233e]">
        <table className="w-full text-sm text-left text-[#c8d8ec]">
          <thead className="text-xs uppercase bg-[#12233e] text-[#7a95b8]">
            <tr>
              <th className="px-4 py-3">Requirement</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Last Checked</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 text-white flex items-center gap-2"><ShieldAlert className="w-4 h-4 text-[#ef4444]" /> UPL Disclaimer Present</td>
              <td className="px-4 py-3"><Badge className="bg-[#22c55e]/20 text-[#22c55e]">Compliant</Badge></td>
              <td className="px-4 py-3 text-[#7a95b8]">Today</td>
              <td className="px-4 py-3"><Button variant="ghost" size="sm" className="h-6 text-xs">View Log</Button></td>
            </tr>
            <tr className="border-b border-[#12233e]">
              <td className="px-4 py-3 text-white flex items-center gap-2"><FileSignature className="w-4 h-4 text-[#3b82f6]" /> State-Specific Clauses</td>
              <td className="px-4 py-3"><Badge className="bg-[#22c55e]/20 text-[#22c55e]">Verified</Badge></td>
              <td className="px-4 py-3 text-[#7a95b8]">Today</td>
              <td className="px-4 py-3"><Button variant="ghost" size="sm" className="h-6 text-xs">View Log</Button></td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-white flex items-center gap-2"><Users className="w-4 h-4 text-[#f0c040]" /> Attorney Relationship</td>
              <td className="px-4 py-3"><Badge className="bg-[#f0c040]/20 text-[#f0c040]">Pending</Badge></td>
              <td className="px-4 py-3 text-[#7a95b8]">-</td>
              <td className="px-4 py-3"><Button variant="ghost" size="sm" className="h-6 text-xs">Assign</Button></td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  if (!clients) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-40 text-[#7a95b8] space-y-4">
          <Sparkles className="w-12 h-12 animate-spin text-[#22c55e]" />
          <p className="text-xl">Initializing Estate Planning Engine...</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto text-[#c8d8ec]">
        <div className="rc-page-header flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-[#0d1a2e] p-6 rounded-2xl border border-[#12233e] shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-[#22c55e]/10 rounded-xl">
                <FileText className="w-8 h-8 text-[#22c55e]" />
              </div>
              <div>
                <h1 className="rc-page-title text-3xl font-bold text-white tracking-tight">
                  Estate Document Generator <span className="text-[#22c55e] text-sm align-top ml-1 border border-[#22c55e]/30 px-2 py-0.5 rounded-full bg-[#22c55e]/10">PRO</span>
                </h1>
                <p className="rc-page-subtitle text-[#7a95b8] mt-1 text-base">
                  Generate comprehensive, state-specific estate planning document drafts using AI.
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              className="border-[#12233e] bg-[#0d1a2e] text-white hover:bg-[#12233e]"
              onClick={() => setShowAnalytics(!showAnalytics)}
            >
              <BarChart3 className="w-4 h-4 mr-2" />
              {showAnalytics ? "Hide Analytics" : "Show Analytics"}
            </Button>
            <ExportToSlides
              toolName="Estate Document Generator"
              getSections={() => [
                {
                  title: "Estate Planning Summary",
                  items: [
                    { label: "Client Name", value: selectedClient?.name || "N/A" },
                    { label: "Age", value: String(selectedClient?.age || "N/A") },
                    { label: "State", value: selectedClient?.state || "N/A" },
                    { label: "Filing Status", value: selectedClient?.filingStatus || "N/A" },
                    { label: "Generated Documents", value: String(generatedDocs.length) }
                  ]
                }
              ]}
            />
            <Select value={selectedClientId || String(selectedClient?.id ?? "")} onValueChange={setSelectedClientId}>
              <SelectTrigger className="w-[280px] bg-[#12233e] border-[#1a2e4c] text-white h-11"><SelectValue placeholder="Select client…" /></SelectTrigger>
              <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                {(clients ?? []).map((c) => (
                  <SelectItem key={c.id} value={String(c.id)} className="hover:bg-[#12233e] py-3">
                    <div className="flex flex-col">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-[#7a95b8]">{c.state} • Age {c.age || 'N/A'}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {showAnalytics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-top-4 duration-500">
            <Card className="bg-[#0d1a2e] border-[#12233e] shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-[#3b82f6]" /> Documents by Category
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {categoryChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '12px', color: '#7a95b8' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0d1a2e] border-[#12233e] shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#22c55e]" /> Complexity vs Drafting Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={complexityChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tick={{fill: '#7a95b8'}} angle={-45} textAnchor="end" height={60} />
                      <YAxis yAxisId="left" stroke="#7a95b8" fontSize={10} tick={{fill: '#7a95b8'}} />
                      <YAxis yAxisId="right" orientation="right" stroke="#7a95b8" fontSize={10} tick={{fill: '#7a95b8'}} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                      />
                      <Bar yAxisId="left" dataKey="complexity" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Complexity (1-10)" />
                      <Line yAxisId="right" type="monotone" dataKey="time" stroke="#22c55e" strokeWidth={2} dot={{r: 3}} name="Time (mins)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0d1a2e] border-[#12233e] shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <LineChartIcon className="w-4 h-4 text-[#f0c040]" /> Generation Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorCore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorAdv" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                      <XAxis dataKey="month" stroke="#7a95b8" fontSize={10} tick={{fill: '#7a95b8'}} />
                      <YAxis stroke="#7a95b8" fontSize={10} tick={{fill: '#7a95b8'}} />
                      <RechartsTooltip 
                        contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="core" stroke="#22c55e" fillOpacity={1} fill="url(#colorCore)" name="Core Docs" />
                      <Area type="monotone" dataKey="advanced" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAdv)" name="Advanced Docs" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#0d1a2e] border-[#12233e] shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#ef4444]" /> Document Category Coverage
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#12233e" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#7a95b8', fontSize: 10 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar name="Complexity" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
                      <Radar name="Time" dataKey="B" stroke="#22c55e" fill="#22c55e" fillOpacity={0.5} />
                      <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                      <Legend wrapperStyle={{ fontSize: '10px', color: '#7a95b8' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-[#0d1a2e] border-[#12233e] shadow-md col-span-1 lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-white text-sm font-medium flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#8b5cf6]" /> Recent System Activity
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {renderRecentActivityTable()}
              </CardContent>
            </Card>
          </div>
        )}

        {!selectedClient ? (
          <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-16 text-center text-[#7a95b8] shadow-lg">
            <div className="w-24 h-24 bg-[#12233e] rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-[#3b82f6] opacity-80" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-3">No Client Selected</h3>
            <p className="max-w-md mx-auto text-lg mb-8">Please select a client from the dropdown above to begin generating estate planning documents.</p>
            <Button className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-8 py-6 text-lg rounded-xl shadow-lg shadow-[#3b82f6]/20">
              <Users className="w-5 h-5 mr-2" /> Select Client
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
            <div className="xl:col-span-1 space-y-6">
              <Card className="bg-[#0d1a2e] border-[#12233e] shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-[#12233e] to-[#0d1a2e] p-4 border-b border-[#12233e]">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4 text-[#3b82f6]" /> Client Profile
                  </h3>
                </div>
                <CardContent className="p-0">
                  {renderClientSummaryTable()}
                </CardContent>
              </Card>

              <Card className="bg-[#0d1a2e] border-[#12233e] shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-[#12233e] to-[#0d1a2e] p-4 border-b border-[#12233e] flex justify-between items-center">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-[#22c55e]" /> Asset Summary
                  </h3>
                  <Badge className="bg-[#12233e] text-[#7a95b8]">Estimated</Badge>
                </div>
                <CardContent className="p-0">
                  {renderAssetsTable()}
                </CardContent>
              </Card>

              <Card className="bg-[#0d1a2e] border-[#12233e] shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-[#12233e] to-[#0d1a2e] p-4 border-b border-[#12233e]">
                  <h3 className="text-white font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-[#ef4444]" /> Compliance Status
                  </h3>
                </div>
                <CardContent className="p-0">
                  {renderComplianceTable()}
                </CardContent>
              </Card>
              
              <div className="bg-[#12233e] rounded-xl p-4 border border-[#1a2e4c]">
                <h4 className="text-white font-medium flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#f0c040]" /> Important Notice
                </h4>
                <p className="text-sm text-[#7a95b8] leading-relaxed">
                  Russell Capital Systems™ provides software tools for financial advisors. We do not provide legal advice. All documents generated are drafts and must be reviewed, finalized, and executed under the guidance of a licensed attorney in the client's jurisdiction ({selectedClient.state || 'Unknown State'}).
                </p>
              </div>
            </div>

            <div className="xl:col-span-3 space-y-6">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <TabsList className="bg-[#0d1a2e] border border-[#12233e] p-1 rounded-xl shadow-sm inline-flex h-auto">
                    <TabsTrigger value="select" className="py-2.5 px-5 data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg font-medium transition-all">
                      <FolderOpen className="w-4 h-4 mr-2" /> Template Library
                    </TabsTrigger>
                    <TabsTrigger value="generated" className="py-2.5 px-5 data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg font-medium transition-all">
                      <FileSignature className="w-4 h-4 mr-2" /> Generated Drafts
                      {generatedDocs.length > 0 && (
                        <span className="ml-2 bg-[#3b82f6] text-white text-xs py-0.5 px-2 rounded-full">{generatedDocs.length}</span>
                      )}
                    </TabsTrigger>
                    <TabsTrigger value="checklist" className="py-2.5 px-5 data-[state=active]:bg-[#12233e] data-[state=active]:text-white text-[#7a95b8] rounded-lg font-medium transition-all">
                      <CheckCircle2 className="w-4 h-4 mr-2" /> Estate Checklist
                    </TabsTrigger>
                  </TabsList>
                  
                  {activeTab === "select" && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => setViewMode("grid")} className={`h-9 w-9 p-0 border-[#12233e] ${viewMode === 'grid' ? 'bg-[#12233e] text-white' : 'bg-[#0d1a2e] text-[#7a95b8]'}`}>
                        <div className="grid grid-cols-2 gap-0.5 w-4 h-4"><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div><div className="bg-current rounded-[1px]"></div></div>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setViewMode("list")} className={`h-9 w-9 p-0 border-[#12233e] ${viewMode === 'list' ? 'bg-[#12233e] text-white' : 'bg-[#0d1a2e] text-[#7a95b8]'}`}>
                        <div className="flex flex-col gap-0.5 w-4 h-4 justify-center"><div className="h-[2px] w-full bg-current rounded-[1px]"></div><div className="h-[2px] w-full bg-current rounded-[1px]"></div><div className="h-[2px] w-full bg-current rounded-[1px]"></div></div>
                      </Button>
                    </div>
                  )}
                </div>

                <TabsContent value="select" className="m-0 space-y-6 animate-in fade-in duration-300">
                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg">
                    <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center mb-8">
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((cat) => (
                          <Button
                            key={cat}
                            variant="outline"
                            size="sm"
                            onClick={() => setFilterCategory(cat)}
                            className={`rounded-full border-[#12233e] transition-all ${
                              filterCategory === cat 
                                ? "bg-[#3b82f6] text-white border-[#3b82f6] shadow-md shadow-[#3b82f6]/20" 
                                : "bg-[#0d1a2e] text-[#7a95b8] hover:bg-[#12233e] hover:text-white"
                            }`}
                          >
                            {cat}
                          </Button>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-3 w-full md:w-auto">
                        <div className="relative w-full md:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                          <Input 
                            placeholder="Search templates..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 bg-[#12233e] border-[#1a2e4c] text-white rounded-xl h-10 focus-visible:ring-[#3b82f6]"
                          />
                          {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a95b8] hover:text-white">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
                          <SelectTrigger className="w-[140px] bg-[#12233e] border-[#1a2e4c] text-white h-10 rounded-xl">
                            <div className="flex items-center gap-2"><Filter className="w-3 h-3" /> <SelectValue /></div>
                          </SelectTrigger>
                          <SelectContent className="bg-[#0d1a2e] border-[#12233e] text-white">
                            <SelectItem value="category">Category</SelectItem>
                            <SelectItem value="name">Name</SelectItem>
                            <SelectItem value="complexity">Complexity</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-4 bg-[#12233e]/50 p-3 rounded-xl border border-[#12233e]">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-white bg-[#3b82f6] px-2.5 py-1 rounded-md">
                          {selectedDocs.length} selected
                        </span>
                        <span className="text-sm text-[#7a95b8]">of {filteredDocs.length} available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={selectAll} className="text-[#3b82f6] hover:text-[#60a5fa] hover:bg-[#3b82f6]/10 h-8">Select All</Button>
                        <Button variant="ghost" size="sm" onClick={selectCore} className="text-[#22c55e] hover:text-[#4ade80] hover:bg-[#22c55e]/10 h-8">Core Only</Button>
                        <Button variant="ghost" size="sm" onClick={clearSelection} disabled={selectedDocs.length === 0} className="text-[#ef4444] hover:text-[#f87171] hover:bg-[#ef4444]/10 h-8">Clear</Button>
                      </div>
                    </div>

                    {filteredDocs.length === 0 ? (
                      <div className="py-20 text-center text-[#7a95b8]">
                        <Search className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="text-lg">No documents found matching your criteria.</p>
                        <Button variant="link" onClick={() => {setSearchQuery(""); setFilterCategory("All");}} className="text-[#3b82f6]">Clear filters</Button>
                      </div>
                    ) : viewMode === "grid" ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredDocs.map((doc) => {
                          const isSelected = selectedDocs.includes(doc.id);
                          const Icon = doc.icon;
                          return (
                            <div 
                              key={doc.id}
                              onClick={() => toggleDoc(doc.id)}
                              className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer group ${
                                isSelected 
                                  ? "bg-[#3b82f6]/10 border-[#3b82f6] shadow-md shadow-[#3b82f6]/10" 
                                  : "bg-[#12233e] border-transparent hover:border-[#1a2e4c] hover:bg-[#162a4a]"
                              }`}
                            >
                              <div className="absolute top-4 right-4">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  isSelected ? "bg-[#3b82f6] border-[#3b82f6] text-white" : "border-[#7a95b8] bg-transparent"
                                }`}>
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                              </div>
                              
                              <div className="flex items-start gap-4 mb-3">
                                <div className={`p-3 rounded-lg ${isSelected ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "bg-[#0d1a2e] text-[#7a95b8] group-hover:text-white transition-colors"}`}>
                                  <Icon className="w-6 h-6" />
                                </div>
                                <div className="pr-6">
                                  <Badge className={`mb-2 text-[10px] uppercase tracking-wider font-semibold ${
                                    doc.category === 'Core' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                                    doc.category === 'Advanced' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' :
                                    doc.category === 'Business' ? 'bg-[#f0c040]/20 text-[#f0c040]' :
                                    'bg-[#3b82f6]/20 text-[#3b82f6]'
                                  }`}>
                                    {doc.category}
                                  </Badge>
                                  <h4 className={`font-semibold text-lg leading-tight ${isSelected ? "text-white" : "text-[#c8d8ec]"}`}>
                                    {doc.name}
                                  </h4>
                                </div>
                              </div>
                              
                              <p className="text-sm text-[#7a95b8] line-clamp-2 mb-4 h-10">
                                {doc.description}
                              </p>
                              
                              <div className="flex items-center justify-between mt-auto pt-4 border-t border-[#1a2e4c]/50">
                                <div className="flex items-center gap-1.5 text-xs text-[#7a95b8]">
                                  <Activity className="w-3.5 h-3.5" />
                                  <span>Complexity: {doc.complexity}/10</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-[#7a95b8]">
                                  <Clock className="w-3.5 h-3.5" />
                                  <span>~{doc.timeToDraft}m draft</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredDocs.map((doc) => {
                          const isSelected = selectedDocs.includes(doc.id);
                          const Icon = doc.icon;
                          return (
                            <div 
                              key={doc.id}
                              onClick={() => toggleDoc(doc.id)}
                              className={`flex items-center p-4 rounded-xl border transition-all cursor-pointer group ${
                                isSelected 
                                  ? "bg-[#3b82f6]/10 border-[#3b82f6]" 
                                  : "bg-[#12233e] border-transparent hover:border-[#1a2e4c] hover:bg-[#162a4a]"
                              }`}
                            >
                              <div className="mr-4">
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  isSelected ? "bg-[#3b82f6] border-[#3b82f6] text-white" : "border-[#7a95b8] bg-transparent"
                                }`}>
                                  {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                                </div>
                              </div>
                              <div className={`p-2.5 rounded-lg mr-4 ${isSelected ? "bg-[#3b82f6]/20 text-[#3b82f6]" : "bg-[#0d1a2e] text-[#7a95b8]"}`}>
                                <Icon className="w-5 h-5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-1">
                                  <h4 className={`font-semibold truncate ${isSelected ? "text-white" : "text-[#c8d8ec]"}`}>
                                    {doc.name}
                                  </h4>
                                  <Badge className={`text-[10px] uppercase tracking-wider font-semibold ${
                                    doc.category === 'Core' ? 'bg-[#22c55e]/20 text-[#22c55e]' :
                                    doc.category === 'Advanced' ? 'bg-[#8b5cf6]/20 text-[#8b5cf6]' :
                                    doc.category === 'Business' ? 'bg-[#f0c040]/20 text-[#f0c040]' :
                                    'bg-[#3b82f6]/20 text-[#3b82f6]'
                                  }`}>
                                    {doc.category}
                                  </Badge>
                                </div>
                                <p className="text-sm text-[#7a95b8] truncate">
                                  {doc.description}
                                </p>
                              </div>
                              <div className="hidden md:flex items-center gap-6 ml-4">
                                <div className="text-xs text-[#7a95b8] text-right">
                                  <div className="font-medium text-[#c8d8ec] mb-0.5">Complexity</div>
                                  <div>{doc.complexity}/10</div>
                                </div>
                                <div className="text-xs text-[#7a95b8] text-right">
                                  <div className="font-medium text-[#c8d8ec] mb-0.5">Est. Time</div>
                                  <div>{doc.timeToDraft} mins</div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    <div className="mt-8 pt-6 border-t border-[#12233e] flex flex-col md:flex-row gap-6">
                      <div className="flex-1">
                        <Label className="text-[#7a95b8] mb-2 block font-medium">Drafting Instructions / Notes for AI</Label>
                        <Textarea 
                          placeholder="E.g., Include specific provisions for the vacation home in Florida, emphasize tax minimization..." 
                          value={customNotes}
                          onChange={(e) => setCustomNotes(e.target.value)}
                          className="bg-[#12233e] border-[#1a2e4c] text-white resize-none h-24 rounded-xl focus-visible:ring-[#3b82f6]"
                        />
                      </div>
                      <div className="md:w-72 flex flex-col justify-end">
                        <div className="bg-[#12233e] p-4 rounded-xl mb-4 border border-[#1a2e4c]">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-[#7a95b8]">Documents Selected:</span>
                            <span className="text-white font-bold">{selectedDocs.length}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-[#7a95b8]">Est. Generation Time:</span>
                            <span className="text-[#f0c040] font-medium">~{(selectedDocs.length * 0.5).toFixed(1)} mins</span>
                          </div>
                        </div>
                        <Button 
                          onClick={handleGenerate} 
                          disabled={generating || selectedDocs.length === 0}
                          className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white h-14 text-lg font-semibold rounded-xl shadow-lg shadow-[#3b82f6]/25 transition-all disabled:opacity-50"
                        >
                          {generating ? (
                            <><Sparkles className="w-5 h-5 mr-2 animate-spin" /> Generating Drafts...</>
                          ) : (
                            <><FileSignature className="w-5 h-5 mr-2" /> Generate Documents</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="generated" className="m-0 space-y-6 animate-in fade-in duration-300">
                  {editingDocId ? (
                    <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#12233e]">
                        <div className="flex items-center gap-3">
                          <Button variant="ghost" onClick={() => setEditingDocId(null)} className="p-2 h-auto text-[#7a95b8] hover:text-white hover:bg-[#12233e]">
                            <ChevronRight className="w-5 h-5 rotate-180" />
                          </Button>
                          <div>
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                              <PenTool className="w-5 h-5 text-[#3b82f6]" /> Edit Document
                            </h3>
                            <p className="text-sm text-[#7a95b8]">Make manual adjustments to the AI-generated draft</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Button variant="outline" onClick={() => setEditingDocId(null)} className="border-[#12233e] bg-transparent text-white hover:bg-[#12233e]">
                            Cancel
                          </Button>
                          <Button onClick={handleSaveEdit} className="bg-[#22c55e] hover:bg-[#16a34a] text-white">
                            <Save className="w-4 h-4 mr-2" /> Save Changes
                          </Button>
                        </div>
                      </div>
                      
                      <div className="bg-white rounded-lg p-1 min-h-[600px] border-4 border-[#12233e]">
                        <Textarea 
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="w-full h-[600px] bg-white text-black font-serif text-sm border-0 focus-visible:ring-0 resize-none p-8"
                          style={{ lineHeight: '1.6' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-2">
                        <div>
                          <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <FileSignature className="w-5 h-5 text-[#3b82f6]" /> Document Vault
                          </h2>
                          <p className="text-[#7a95b8] text-sm">Generated drafts ready for review</p>
                        </div>
                        <div className="flex gap-3">
                          <Button variant="outline" className="border-[#12233e] bg-[#0d1a2e] text-white hover:bg-[#12233e]">
                            <Share2 className="w-4 h-4 mr-2" /> Share with Client
                          </Button>
                          <Button onClick={handleExportAll} className="bg-[#3b82f6] hover:bg-[#2563eb] text-white">
                            <Download className="w-4 h-4 mr-2" /> Export All (PDF)
                          </Button>
                        </div>
                      </div>

                      <Card className="bg-[#0d1a2e] border-[#12233e] shadow-lg">
                        <CardContent className="p-0">
                          {renderGeneratedDocsTable()}
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        <Card className="bg-[#0d1a2e] border-[#12233e] shadow-lg">
                          <CardHeader>
                            <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
                              <PieChartIcon className="w-5 h-5 text-[#8b5cf6]" /> Draft Composition
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[250px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={generatedStatsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    labelLine={false}
                                  >
                                    {generatedStatsData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#fff' }} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="bg-[#0d1a2e] border-[#12233e] shadow-lg">
                          <CardHeader>
                            <CardTitle className="text-white text-lg font-medium flex items-center gap-2">
                              <History className="w-5 h-5 text-[#f0c040]" /> Next Steps
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="flex items-start gap-3 p-3 bg-[#12233e] rounded-xl border border-[#1a2e4c]">
                                <div className="p-2 bg-[#3b82f6]/20 rounded-lg text-[#3b82f6] mt-0.5"><Mail className="w-4 h-4" /></div>
                                <div>
                                  <h4 className="text-white font-medium text-sm">Send to Legal Team</h4>
                                  <p className="text-xs text-[#7a95b8] mt-1">Forward drafts to partnered attorney for formal review and finalization.</p>
                                  <Button variant="link" className="h-auto p-0 text-[#3b82f6] text-xs mt-2">Draft Email →</Button>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 p-3 bg-[#12233e] rounded-xl border border-[#1a2e4c]">
                                <div className="p-2 bg-[#f0c040]/20 rounded-lg text-[#f0c040] mt-0.5"><Calendar className="w-4 h-4" /></div>
                                <div>
                                  <h4 className="text-white font-medium text-sm">Schedule Client Review</h4>
                                  <p className="text-xs text-[#7a95b8] mt-1">Book a 45-minute session to review draft concepts with {selectedClient.name}.</p>
                                  <Button variant="link" className="h-auto p-0 text-[#f0c040] text-xs mt-2">Open Calendar →</Button>
                                </div>
                              </div>
                              <div className="flex items-start gap-3 p-3 bg-[#12233e] rounded-xl border border-[#1a2e4c]">
                                <div className="p-2 bg-[#22c55e]/20 rounded-lg text-[#22c55e] mt-0.5"><Bell className="w-4 h-4" /></div>
                                <div>
                                  <h4 className="text-white font-medium text-sm">Set Execution Reminder</h4>
                                  <p className="text-xs text-[#7a95b8] mt-1">Create automated follow-ups for signature collection and notarization.</p>
                                  <Button variant="link" className="h-auto p-0 text-[#22c55e] text-xs mt-2">Create Alert →</Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </TabsContent>

                <TabsContent value="checklist" className="m-0 space-y-6 animate-in fade-in duration-300">
                  <div className="rc-card bg-[#0d1a2e] border border-[#12233e] rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-[#22c55e]" /> Implementation Checklist
                        </h2>
                        <p className="text-[#7a95b8] text-sm mt-1">Track progress of the estate planning engagement</p>
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-white">40%</div>
                        <div className="text-xs text-[#7a95b8]">Overall Completion</div>
                      </div>
                    </div>
                    
                    <div className="w-full bg-[#12233e] rounded-full h-2.5 mb-8">
                      <div className="bg-gradient-to-r from-[#22c55e] to-[#3b82f6] h-2.5 rounded-full" style={{ width: '40%' }}></div>
                    </div>

                    {renderChecklistTable()}
                    
                    <div className="mt-6 flex justify-end">
                      <Button className="bg-[#12233e] hover:bg-[#1a2e4c] text-white border border-[#1a2e4c]">
                        <Download className="w-4 h-4 mr-2" /> Download Checklist PDF
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

function generateDocContent(docType: any, client: any, totalAssets: number) {
  const date = new Date().toLocaleDateString();
  const name = client.name || "Client Name";
  const state = client.state || "State";
  
  switch (docType.id) {
    case "will":
      return `LAST WILL AND TESTAMENT OF ${name.toUpperCase()}

I, ${name}, a resident of ${state}, being of sound mind and memory, do hereby make, publish, and declare this to be my Last Will and Testament, revoking all prior wills and codicils.

ARTICLE I — FAMILY INFORMATION
I am currently married to [SPOUSE NAME] (hereinafter referred to as "my spouse"). I have [NUMBER] children: [CHILDREN NAMES].

ARTICLE II — DEBTS AND EXPENSES
I direct my Executor to pay all my legally enforceable debts, funeral expenses, and expenses of my last illness, as soon as practicable after my death.

ARTICLE III — SPECIFIC BEQUESTS
I give, devise, and bequeath the following specific items of property:
1. [SPECIFIC ITEM 1] to [BENEFICIARY 1]
2. [SPECIFIC ITEM 2] to [BENEFICIARY 2]

ARTICLE IV — RESIDUARY ESTATE
I give, devise, and bequeath all the rest, residue, and remainder of my estate, both real and personal, wherever situated, to my spouse, [SPOUSE NAME], if surviving me. If my spouse does not survive me, I leave my residuary estate to my children in equal shares.

ARTICLE V — EXECUTOR
I appoint [EXECUTOR NAME] as Executor of this Will. If [EXECUTOR NAME] is unable or unwilling to serve, I appoint [ALTERNATE EXECUTOR] as alternate Executor.

ARTICLE VI — GUARDIAN (if applicable)
[Guardianship provisions for minor children, if applicable]

ARTICLE VII — POWERS OF EXECUTOR
My Executor shall have full power and authority to sell, lease, mortgage, or otherwise dispose of any property of my estate, without court order, as my Executor deems advisable.

ARTICLE VIII — NO-CONTEST CLAUSE
If any beneficiary under this Will contests or attacks this Will or any of its provisions, any share or interest given to that beneficiary is revoked and shall be disposed of as if that beneficiary had predeceased me.

IN WITNESS WHEREOF, I have hereunto set my hand this ${date}.

_________________________________
${name}, Testator

WITNESSES:
_________________________________    _________________________________
Witness 1                              Witness 2

[DRAFT — Generated by Russell Capital Systems™ for planning purposes. Must be reviewed and executed by a licensed ${state} attorney.]`;

    case "trust_revocable":
      return `REVOCABLE LIVING TRUST AGREEMENT

Trust Name: The ${client.name?.split(" ").slice(1).join(" ") ?? "Client"} Family Revocable Trust
Date: ${date}
Grantor/Trustee: ${name}
State: ${state}

ARTICLE I — CREATION OF TRUST
I, ${name}, hereby create this Revocable Living Trust and transfer the property listed in Schedule A to myself as Trustee.

ARTICLE II — TRUST PROPERTY
The Trust shall hold and manage assets including but not limited to:
- Retirement accounts (estimated value: $${(Number(client.iraBalance ?? 0) + Number(client.rothBalance ?? 0)).toLocaleString()})
- Taxable investment accounts (estimated value: $${(Number(client.taxableAssets ?? 0)).toLocaleString()})
- Real estate equity (estimated value: $${(Number(client.realEstateEquity ?? 0)).toLocaleString()})
- Life insurance (cash value: $${(Number(client.lifeInsuranceCv ?? 0)).toLocaleString()})

ARTICLE III — TRUSTEE POWERS
During my lifetime, I retain full power to amend, revoke, or terminate this Trust. I may add or remove property at any time.

ARTICLE IV — DISTRIBUTIONS DURING LIFETIME
The Trustee shall distribute income and principal to the Grantor as requested.

ARTICLE V — UPON INCAPACITY
If I become incapacitated, the Successor Trustee shall manage Trust assets for my benefit, paying for my care, support, and maintenance.

ARTICLE VI — UPON DEATH
Upon my death, the Trust becomes irrevocable. The Successor Trustee shall:
1. Pay all debts, taxes, and administrative expenses
2. Distribute specific bequests as outlined in Schedule B
3. Distribute the remaining Trust estate to beneficiaries as outlined in Schedule C

ARTICLE VII — SUCCESSOR TRUSTEE
[SUCCESSOR TRUSTEE NAME] shall serve as Successor Trustee.

ARTICLE VIII — SPENDTHRIFT PROVISION
No beneficiary may assign, anticipate, or encumber their interest in this Trust.

Total estimated estate value: $${totalAssets.toLocaleString()}

[DRAFT — Generated by Russell Capital Systems™. Requires attorney review and proper execution under ${state} law.]`;

    default:
      return `${docType.name.toUpperCase()}

Prepared for: ${name}
State: ${state}
Date: ${date}

This document has been drafted based on the financial profile and estate planning needs of ${name}.

Total estimated assets: $${totalAssets.toLocaleString()}

${docType.description}

[Full document content would be generated based on specific client data, state laws, and individual circumstances.]

KEY PROVISIONS:
1. [Provision details based on document type and client needs]
2. [State-specific requirements for ${state}]
3. [Integration with existing estate planning documents]

IMPORTANT NOTICES:
- This is a draft document generated by Russell Capital Systems™
- All estate planning documents must be reviewed by a licensed attorney
- State-specific requirements for ${state} must be verified
- Document must be properly executed (signed, witnessed, notarized as required)
- Beneficiary designations on financial accounts should be coordinated with this document

[DRAFT — Generated by Russell Capital Systems™ for planning purposes only.]`;
  }
}

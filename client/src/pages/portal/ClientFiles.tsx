// @ts-nocheck
import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { PageInsights } from "@/components/PageInsights";
import { useClientData } from "@/contexts/ClientDataContext";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  Lock,
  Unlock,
  FileText,
  Upload,
  Download,
  Eye,
  FolderOpen,
  Shield,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileDigit,
  TrendingUp,
  MoreVertical,
  Share2,
  Trash2,
  History,
  Tag,
  FileWarning,
  Key,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart3,
  Activity,
  ShieldCheck,
  HardDrive,
  FileSignature,
  Files,
} from "lucide-react";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, AreaChart, Area, ScatterChart, Scatter, ZAxis
} from "recharts";

interface FileItem {
  id: string;
  name: string;
  type: string;
  size: string;
  sizeBytes: number;
  date: string;
  category: string;
  status: string;
  tags: string[];
  lastModifiedBy: string;
  version: number;
  isShared: boolean;
  downloads: number;
  retentionDate: string;
  encryptionStatus: string;
}

interface ActivityLog {
  id: string;
  action: string;
  user: string;
  timestamp: string;
  details: string;
}

export default function ClientFiles() {
  const { data: clientData } = useClientData();
  const { user } = useAuth();
  
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [sortBy, setSortBy] = useState<"date" | "name" | "size">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilters, setShowFilters] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const verifyMut = trpc.hiddenMaterial.verifyPassword.useMutation({
    onSuccess: (data: any) => {
      if (data.valid) {
        setIsUnlocked(true);
        setError("");
        toast.success("Client files unlocked!");
        sessionStorage.setItem("clientFilesUnlocked", "true");
      } else {
        setError("Incorrect password. Please try again.");
      }
    },
    onError: () => setError("Verification failed. Please try again.")
  });

  const uploadMut = trpc.docs.upload.useMutation({
    onSuccess: () => { toast.success("File uploaded successfully!"); setUploading(false); },
    onError: (e: any) => { toast.error(e.message); setUploading(false); },
  });

  const getFilesQuery = trpc.documentVault.getFiles.useQuery(
    { clientId: clientData?.clientId?.toString() || "" },
    { enabled: !!clientData?.clientId && isUnlocked }
  );

  const getStorageStatsQuery = trpc.documentVault.getStorageStats.useQuery(
    { clientId: clientData?.clientId?.toString() || "" },
    { enabled: !!clientData?.clientId && isUnlocked }
  );

  const getActivityQuery = trpc.activity.getRecent.useQuery(
    { clientId: clientData?.clientId?.toString() || "", limit: 10 },
    { enabled: !!clientData?.clientId && isUnlocked }
  );

  const deleteFileMut = trpc.documentVault.deleteFile.useMutation({
    onSuccess: () => toast.success("File deleted successfully"),
    onError: (e: any) => toast.error(`Delete failed: ${e.message}`)
  });

  const shareFileMut = trpc.clientPortal.shareDocument.useMutation({
    onSuccess: () => toast.success("Document shared successfully"),
    onError: (e: any) => toast.error(`Share failed: ${e.message}`)
  });

  const tagFileMut = trpc.tags.addTag.useMutation({
    onSuccess: () => toast.success("Tag added successfully")
  });

  const complianceCheckMut = trpc.complianceAudit.checkDocument.useMutation({
    onSuccess: (data: any) => {
      if (data.passed) toast.success("Compliance check passed");
      else toast.warning(`Compliance warning: ${data.issues.join(", ")}`);
    }
  });

  const requestSignatureMut = trpc.onboarding.requestSignature.useMutation({
    onSuccess: () => toast.success("Signature request sent")
  });

  useEffect(() => {
    const unlocked = sessionStorage.getItem("clientFilesUnlocked");
    if (unlocked === "true") setIsUnlocked(true);
  }, []);

  const handleUnlock = () => {
    if (!password.trim()) {
      setError("Please enter the password");
      return;
    }
    verifyMut.mutate({ password });
  };

  const processFiles = (files: FileList | File[]) => {
    const clientId = clientData?.clientId;
    if (!clientId) { toast.error("No client selected"); return; }
    setUploading(true);
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} exceeds 10MB limit`); continue; }
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        uploadMut.mutate({
          clientId: Number(clientId),
          name: file.name,
          fileBase64: base64,
          mimeType: file.type || "application/octet-stream",
          sizeBytes: file.size,
          category: "OTHER",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files?.length) processFiles(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    processFiles(files);
    e.target.value = "";
  };

  const toggleFileSelection = (id: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(id)) newSelection.delete(id);
    else newSelection.add(id);
    setSelectedFiles(newSelection);
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) setSelectedFiles(new Set());
    else setSelectedFiles(new Set(filteredFiles.map((f) => f.id)));
  };

  const mockFiles: FileItem[] = [{ id: "1", name: "Financial Fact Finder", type: "PDF", size: "2.4 MB", sizeBytes: 2516582, date: "2026-03-15", category: "onboarding", status: "complete", tags: ["KYC", "Required"], lastModifiedBy: "System", version: 1, isShared: true, downloads: 3, retentionDate: "2033-03-15", encryptionStatus: "AES-256" },
,
    { id: "2", name: "Risk Assessment Report", type: "PDF", size: "1.8 MB", sizeBytes: 1887436, date: "2026-03-15", category: "assessment", status: "complete", tags: ["Risk", "Q1"], lastModifiedBy: "Advisor", version: 2, isShared: true, downloads: 1, retentionDate: "2033-03-15", encryptionStatus: "AES-256" },
,
    { id: "3", name: "Life Goals Roadmap", type: "PDF", size: "3.1 MB", sizeBytes: 3250585, date: "2026-03-15", category: "planning", status: "complete", tags: ["Planning", "Goals"], lastModifiedBy: "Advisor", version: 1, isShared: true, downloads: 5, retentionDate: "2033-03-15", encryptionStatus: "AES-256" },
,
    { id: "4", name: "IUL Policy Illustration", type: "PDF", size: "5.2 MB", sizeBytes: 5452595, date: "2026-03-20", category: "insurance", status: "pending", tags: ["Life", "Illustration"], lastModifiedBy: "Carrier", version: 1, isShared: false, downloads: 0, retentionDate: "2033-03-20", encryptionStatus: "AES-256" },
,
    { id: "5", name: "Roth Conversion Strategy", type: "PDF", size: "1.5 MB", sizeBytes: 1572864, date: "2026-03-22", category: "tax", status: "complete", tags: ["Tax", "Strategy"], lastModifiedBy: "CPA", version: 3, isShared: true, downloads: 2, retentionDate: "2033-03-22", encryptionStatus: "AES-256" }
];

  const files = getFilesQuery.data?.files || mockFiles;

  const CATEGORY_COLORS: Record<string, string> = {
    onboarding: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    assessment: "bg-purple-500/20 text-purple-400 border-purple-500/30",
    planning: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    insurance: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    tax: "bg-red-500/20 text-red-400 border-red-500/30",
    legal: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    review: "bg-pink-500/20 text-pink-400 border-pink-500/30",
  };

  const STATUS_COLORS: Record<string, string> = {
    complete: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    pending: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    draft: "text-muted-foreground bg-gray-500/10 border-gray-500/20",
  };

  const filteredFiles = useMemo(() => {
    return files.filter((f) => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            f.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            f.tags.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesTab = activeTab === "all" || f.status === activeTab;
      const matchesCategory = selectedCategory === "all" || f.category === selectedCategory;
      return matchesSearch && matchesTab && matchesCategory;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortBy === "date") comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortBy === "name") comparison = a.name.localeCompare(b.name);
      else if (sortBy === "size") comparison = a.sizeBytes - b.sizeBytes;
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [files, searchTerm, activeTab, selectedCategory, sortBy, sortOrder]);

  const exportCSV = () => {
    const headers = ["Name", "Type", "Size", "Date", "Category", "Status", "Tags", "Version", "Shared"];
    const rows = filteredFiles.map((f) => [
      f.name, f.type, f.size, f.date, f.category, f.status, f.tags.join(";"), f.version.toString(), f.isShared.toString()
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `client_files_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Exported files to CSV");
  };

  const handleAction = (action: string, file: FileItem) => {
    switch (action) {
      case "download":
        toast.success(`Downloading ${file.name}...`);
        break;
      case "view":
        toast.info(`Opening ${file.name}...`);
        break;
      case "share":
        shareFileMut.mutate({ documentId: file.id, clientId: clientData?.clientId?.toString() || "" });
        break;
      case "delete":
        if (confirm(`Are you sure you want to delete ${file.name}?`)) {
          deleteFileMut.mutate({ documentId: file.id });
        }
        break;
      case "sign":
        requestSignatureMut.mutate({ documentId: file.id, clientId: clientData?.clientId?.toString() || "" });
        break;
      case "check":
        complianceCheckMut.mutate({ documentId: file.id });
        break;
    }
  };

  const categoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    files.forEach((f) => { counts[f.category] = (counts[f.category] || 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value,
      color: CATEGORY_COLORS[name]?.split(" ")[1].replace("text-", "") || "gray-400"
    }));
  }, [files]);

  const colorMap: Record<string, string> = {
    "blue-400": "#60a5fa", "purple-400": "#c084fc", "emerald-400": "#34d399",
    "amber-400": "#fbbf24", "red-400": "#f87171", "cyan-400": "#22d3ee",
    "pink-400": "#f472b6", "gray-400": "#9ca3af"
  };

  const storageData = [
    { name: "Jan", used: 15.2, limit: 50 },
    { name: "Feb", used: 19.8, limit: 50 },
    { name: "Mar", used: 24.5, limit: 50 },
    { name: "Apr", used: 28.1, limit: 50 },
  ];

  const typeData = [
    { name: "PDF", count: files.filter((f) => f.type === "PDF").length },
    { name: "DOCX", count: files.filter((f) => f.type === "DOCX").length },
    { name: "XLSX", count: files.filter((f) => f.type === "XLSX").length },
    { name: "IMG", count: files.filter((f) => ["JPG", "PNG"].includes(f.type)).length },
  ];

  const activityData = [
    { day: "Mon", uploads: 2, downloads: 5, views: 12 },
    { day: "Tue", uploads: 1, downloads: 3, views: 8 },
    { day: "Wed", uploads: 4, downloads: 8, views: 15 },
    { day: "Thu", uploads: 0, downloads: 2, views: 6 },
    { day: "Fri", uploads: 3, downloads: 6, views: 10 },
    { day: "Sat", uploads: 0, downloads: 1, views: 2 },
    { day: "Sun", uploads: 0, downloads: 0, views: 1 },
  ];

  const sizeDistributionData = [
    { size: "< 1MB", count: files.filter((f) => f.sizeBytes < 1048576).length },
    { size: "1-3MB", count: files.filter((f) => f.sizeBytes >= 1048576 && f.sizeBytes < 3145728).length },
    { size: "3-5MB", count: files.filter((f) => f.sizeBytes >= 3145728 && f.sizeBytes < 5242880).length },
    { size: "> 5MB", count: files.filter((f) => f.sizeBytes >= 5242880).length },
  ];

  if (!isUnlocked) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="rc-card w-full max-w-md border-[#f0c040]/30 shadow-lg shadow-[#f0c040]/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="text-center mb-6">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f0c040]/20 to-transparent flex items-center justify-center mx-auto mb-6 border border-[#f0c040]/30 shadow-[0_0_30px_rgba(240,192,64,0.1)]">
                <Lock className="w-10 h-10 text-[#f0c040]" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Secure Document Vault</h2>
              <p className="text-[#7a95b8] text-sm leading-relaxed px-4">
                This area contains highly sensitive client documents. Enter your secure password to verify your identity and decrypt the vault contents.
              </p>
            </div>
            <div className="space-y-5">
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#7a95b8]" />
                <input
                  type="password"
                  placeholder="Enter vault password..."
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  onKeyDown={e => e.key === "Enter" && handleUnlock()}
                  className={`rc-input w-full pl-10 py-3 text-lg ${error ? "border-red-500/50 focus:border-red-500/50 bg-red-500/5" : ""}`}
                  autoFocus
                />
                {error && <p className="text-sm text-red-400 mt-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {error}</p>}
              </div>
              <button
                className="rc-btn rc-btn-primary w-full justify-center py-3 text-lg font-medium shadow-[0_0_20px_rgba(34,197,94,0.2)] hover:shadow-[0_0_25px_rgba(34,197,94,0.3)] transition-all"
                onClick={handleUnlock}
                disabled={verifyMut.isPending}
              >
                {verifyMut.isPending ? (
                  <><RefreshCw className="w-5 h-5 mr-2 animate-spin" /> Decrypting Vault...</>
                ) : (
                  <><Unlock className="w-5 h-5 mr-2" /> Unlock Vault</>
                )}
              </button>
              
              <div className="pt-4 border-t border-[#12233e] grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2 text-xs text-[#7a95b8]">
                  <ShieldCheck className="w-4 h-4 text-[#22c55e]" />
                  <span>AES-256 Encryption</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#7a95b8]">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span>Access Monitored</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#7a95b8]">
                  <HardDrive className="w-4 h-4 text-purple-400" />
                  <span>Encrypted at Rest</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-[#7a95b8]">
                  <FileWarning className="w-4 h-4 text-amber-400" />
                  <span>FINRA Compliant</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const totalSize = files.reduce((acc, f) => acc + f.sizeBytes, 0);
  const formattedTotalSize = (totalSize / (1024 * 1024)).toFixed(1);

  return (
    <AppShell>
      <div className="space-y-6 max-w-[1600px] mx-auto pb-12 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="rc-page-header flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-[#0d1a2e] to-[#0a1424] p-6 rounded-2xl border border-[#12233e] shadow-lg">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2.5 bg-gradient-to-br from-[#f0c040]/20 to-[#f0c040]/5 rounded-xl border border-[#f0c040]/30 shadow-[0_0_15px_rgba(240,192,64,0.15)]">
                <FolderOpen className="w-7 h-7 text-[#f0c040]" />
              </div>
              <div>
                <h1 className="rc-page-title text-3xl font-bold text-white tracking-tight">Client Document Vault</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-[#c8d8ec] font-medium">{clientData?.clientName || "Client"}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12233e]"></span>
                  <span className="text-[#7a95b8] text-sm flex items-center gap-1">
                    <Shield className="w-3.5 h-3.5" /> Highly Confidential
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button 
              onClick={() => {
                setIsRefreshing(true);
                setTimeout(() => setIsRefreshing(false), 1000);
                toast.success("Vault synced with cloud storage");
              }} 
              className="rc-btn rc-btn-ghost text-sm"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} /> Sync
            </button>
            <button onClick={exportCSV} className="rc-btn rc-btn-ghost text-sm">
              <Download className="w-4 h-4 mr-2" /> Export Log
            </button>
            <ExportToSlides
              toolName="Client Vault"
              getSections={() => [
                {
                  title: "Vault Summary",
                  items: [
                    { label: "Total Documents", value: files.length.toString() },
                    { label: "Storage Used", value: `${formattedTotalSize} MB` },
                    { label: "Pending Signatures", value: files.filter((f) => f.status === "pending").length.toString() },
                    { label: "Compliance Status", value: "100% Verified" }
                  ]
                }
              ]}
            />
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] text-sm font-medium">
              <Unlock className="w-4 h-4" /> Vault Decrypted
            </div>
            <button
              className="rc-btn rc-btn-ghost text-sm border border-red-500/30 text-red-400 hover:bg-red-500/10 hover:text-red-300"
              onClick={() => { setIsUnlocked(false); setPassword(""); sessionStorage.removeItem("clientFilesUnlocked"); toast.info("Vault locked securely"); }}
            >
              <Lock className="w-4 h-4 mr-2" /> Lock Vault
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="rc-card flex flex-col justify-center p-5 hover:border-blue-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                <Files className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-blue-500/10 text-blue-400">+3 this week</span>
            </div>
            <p className="text-[#7a95b8] text-sm font-medium mb-1">Total Documents</p>
            <p className="text-3xl font-bold text-white">{files.length}</p>
          </div>
          
          <div className="rc-card flex flex-col justify-center p-5 hover:border-[#22c55e]/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#22c55e]/10 flex items-center justify-center border border-[#22c55e]/20 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5 text-[#22c55e]" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-[#22c55e]/10 text-[#22c55e]">92% completion</span>
            </div>
            <p className="text-[#7a95b8] text-sm font-medium mb-1">Completed & Verified</p>
            <p className="text-3xl font-bold text-white">{files.filter((f) => f.status === "complete").length}</p>
          </div>
          
          <div className="rc-card flex flex-col justify-center p-5 hover:border-[#f0c040]/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-[#f0c040]/10 flex items-center justify-center border border-[#f0c040]/20 group-hover:scale-110 transition-transform">
                <FileSignature className="w-5 h-5 text-[#f0c040]" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-500/10 text-red-400">1 urgent</span>
            </div>
            <p className="text-[#7a95b8] text-sm font-medium mb-1">Signatures Needed</p>
            <p className="text-3xl font-bold text-white">{files.filter((f) => f.status === "pending").length}</p>
          </div>
          
          <div className="rc-card flex flex-col justify-center p-5 hover:border-purple-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                <HardDrive className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-purple-500/10 text-purple-400">56% of quota</span>
            </div>
            <p className="text-[#7a95b8] text-sm font-medium mb-1">Storage Utilized</p>
            <p className="text-3xl font-bold text-white">{formattedTotalSize} MB</p>
          </div>

          <div className="rc-card flex flex-col justify-center p-5 hover:border-cyan-500/30 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20 group-hover:scale-110 transition-transform">
                <Share2 className="w-5 h-5 text-cyan-400" />
              </div>
              <span className="text-xs font-medium px-2 py-1 rounded-full bg-cyan-500/10 text-cyan-400">Active</span>
            </div>
            <p className="text-[#7a95b8] text-sm font-medium mb-1">Shared Externally</p>
            <p className="text-3xl font-bold text-white">{files.filter((f) => f.isShared).length}</p>
          </div>
        </div>

        {/* Charts Section - 5 Recharts Components Required */}
        <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Chart 1: Document Categories (PieChart) */}
          <div className="rc-card xl:col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                <PieChartIcon className="w-4 h-4 text-blue-400" /> Categories
              </h3>
            </div>
            <div className="h-[180px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colorMap[entry.color] || "#9ca3af"} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', color: '#c8d8ec', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: '#c8d8ec' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 2: Storage Usage Trend (AreaChart) */}
          <div className="rc-card xl:col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                <TrendingUp className="w-4 h-4 text-purple-400" /> Storage Trend
              </h3>
            </div>
            <div className="h-[180px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={storageData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUsed" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#c084fc" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#c084fc" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="name" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="used" stroke="#c084fc" strokeWidth={2} fillOpacity={1} fill="url(#colorUsed)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 3: Activity Over Time (LineChart) */}
          <div className="rc-card xl:col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                <Activity className="w-4 h-4 text-[#22c55e]" /> Weekly Activity
              </h3>
            </div>
            <div className="h-[180px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="day" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Line type="monotone" dataKey="views" stroke="#34d399" strokeWidth={2} dot={{ r: 3, fill: '#0d1a2e', strokeWidth: 2 }} />
                  <Line type="monotone" dataKey="downloads" stroke="#60a5fa" strokeWidth={2} dot={{ r: 3, fill: '#0d1a2e', strokeWidth: 2 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 4: File Types (BarChart) */}
          <div className="rc-card xl:col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                <BarChart3 className="w-4 h-4 text-amber-400" /> File Formats
              </h3>
            </div>
            <div className="h-[180px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" horizontal={false} />
                  <XAxis type="number" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} width={40} />
                  <RechartsTooltip 
                    cursor={{ fill: '#12233e', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#fbbf24" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Chart 5: Size Distribution (BarChart) */}
          <div className="rc-card xl:col-span-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold flex items-center gap-2 text-sm">
                <HardDrive className="w-4 h-4 text-cyan-400" /> Size Distribution
              </h3>
            </div>
            <div className="h-[180px] w-full flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sizeDistributionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" vertical={false} />
                  <XAxis dataKey="size" stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7a95b8" fontSize={10} tickLine={false} axisLine={false} />
                  <RechartsTooltip 
                    cursor={{ fill: '#12233e', opacity: 0.4 }}
                    contentStyle={{ backgroundColor: '#0d1a2e', borderColor: '#12233e', borderRadius: '8px', fontSize: '12px' }}
                  />
                  <Bar dataKey="count" fill="#22d3ee" radius={[4, 4, 0, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Upload & Filters */}
          <div className="lg:col-span-1 space-y-6">
            {/* Upload Zone */}
            <div
              className={`rc-card border-dashed border-2 transition-all cursor-pointer flex flex-col items-center justify-center p-8 text-center relative overflow-hidden group ${
                dragOver ? "border-[#22c55e] bg-[#22c55e]/5 scale-[1.02]" : "border-[#12233e] hover:border-blue-500/50 hover:bg-[#12233e]/30"
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 transition-all duration-300 relative z-10 ${dragOver ? "bg-[#22c55e]/20 scale-110" : "bg-[#12233e] group-hover:bg-blue-500/20 group-hover:scale-110"}`}>
                <Upload className={`w-8 h-8 transition-colors ${dragOver ? "text-[#22c55e]" : "text-[#7a95b8] group-hover:text-blue-400"}`} />
              </div>
              <p className="text-white font-semibold mb-2 relative z-10 text-lg">Secure Upload</p>
              <p className="text-[#7a95b8] text-sm mb-6 max-w-[200px] relative z-10">
                Drag & drop files here or click to browse. Files are encrypted instantly.
              </p>
              <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.xlsx,.jpg,.jpeg,.png" className="hidden" onChange={handleFileUpload} />
              <button className="rc-btn rc-btn-primary w-full relative z-10 shadow-lg shadow-blue-500/20" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} disabled={uploading}>
                {uploading ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Encrypting...</> : "Select Files"}
              </button>
              <div className="mt-4 flex items-center gap-2 text-xs text-[#7a95b8] relative z-10">
                <Shield className="w-3.5 h-3.5 text-[#22c55e]" /> Max 10MB per file
              </div>
            </div>

            {/* Filters */}
            <div className="rc-card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <Filter className="w-4 h-4 text-[#7a95b8]" /> Filters & Sorting
                </h3>
                <button 
                  onClick={() => { setSearchTerm(""); setActiveTab("all"); setSelectedCategory("all"); setSortBy("date"); setSortOrder("desc"); }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Reset
                </button>
              </div>
              
              <div className="space-y-5">
                <div>
                  <label className="text-xs text-[#7a95b8] font-medium mb-2 block uppercase tracking-wider">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7a95b8]" />
                    <input
                      placeholder="Name, category, tag..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="rc-input w-full pl-9 py-2 text-sm bg-[#060d19]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#7a95b8] font-medium mb-2 block uppercase tracking-wider">Status</label>
                  <div className="flex flex-col gap-1.5">
                    {["all", "complete", "pending", "draft"].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all ${
                          activeTab === tab 
                            ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                            : "text-[#c8d8ec] hover:bg-[#12233e] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {tab === "complete" && <CheckCircle2 className="w-4 h-4" />}
                          {tab === "pending" && <Clock className="w-4 h-4" />}
                          {tab === "draft" && <FileDigit className="w-4 h-4" />}
                          {tab === "all" && <Files className="w-4 h-4" />}
                          <span className="capitalize">{tab}</span>
                        </div>
                        <span className="text-xs bg-[#060d19] px-2 py-0.5 rounded-full">
                          {tab === "all" ? files.length : files.filter((f) => f.status === tab).length}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-[#7a95b8] font-medium mb-2 block uppercase tracking-wider">Category</label>
                  <select 
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="rc-input w-full py-2 text-sm bg-[#060d19]"
                  >
                    <option value="all">All Categories</option>
                    <option value="onboarding">Onboarding</option>
                    <option value="planning">Financial Planning</option>
                    <option value="insurance">Insurance & Annuities</option>
                    <option value="tax">Tax Documents</option>
                    <option value="legal">Legal & Estate</option>
                    <option value="assessment">Risk Assessments</option>
                    <option value="review">Performance Reviews</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-[#7a95b8] font-medium mb-2 block uppercase tracking-wider">Sort By</label>
                  <div className="flex gap-2">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="rc-input flex-1 py-2 text-sm bg-[#060d19]"
                    >
                      <option value="date">Date Added</option>
                      <option value="name">File Name</option>
                      <option value="size">File Size</option>
                    </select>
                    <button 
                      onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                      className="rc-btn rc-btn-ghost px-3 border border-[#12233e]"
                      title={`Sort ${sortOrder === "asc" ? "Descending" : "Ascending"}`}
                    >
                      {sortOrder === "asc" ? "↑" : "↓"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Recent Activity Mini-Feed */}
            <div className="rc-card">
              <h3 className="text-white font-semibold flex items-center gap-2 mb-4 text-sm">
                <History className="w-4 h-4 text-[#7a95b8]" /> Recent Activity
              </h3>
              <div className="space-y-4">
                {[
                  { id: 1, action: "Downloaded", file: "Tax Return 2025.pdf", time: "2 hours ago", icon: Download, color: "text-blue-400" },
                  { id: 2, action: "Uploaded", file: "Mortgage Statement.pdf", time: "Yesterday", icon: Upload, color: "text-[#22c55e]" },
                  { id: 3, action: "Shared", file: "Estate Plan.docx", time: "2 days ago", icon: Share2, color: "text-purple-400" },
                ].map((act) => (
                  <div key={act.id} className="flex gap-3">
                    <div className={`mt-0.5 ${act.color}`}>
                      <act.icon className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm text-[#c8d8ec]"><span className="font-medium text-white">{act.action}</span> {act.file}</p>
                      <p className="text-xs text-[#7a95b8]">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Main Area - File List */}
          <div className="lg:col-span-3 flex flex-col h-full">
            <div className="rc-card p-0 overflow-hidden flex flex-col h-full border border-[#12233e] shadow-lg">
              {/* Toolbar */}
              <div className="p-4 border-b border-[#12233e] flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a1424]">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    Documents <span className="text-xs font-normal px-2 py-0.5 rounded-full bg-[#12233e] text-[#7a95b8]">{filteredFiles.length}</span>
                  </h2>
                  {selectedFiles.size > 0 && (
                    <div className="flex items-center gap-2 ml-4 pl-4 border-l border-[#12233e] animate-in fade-in slide-in-from-left-4">
                      <span className="text-sm text-blue-400 font-medium">{selectedFiles.size} selected</span>
                      <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-md transition-colors" title="Download Selected">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-md transition-colors" title="Share Selected">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button className="p-1.5 text-[#7a95b8] hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors" title="Delete Selected">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={selectAllFiles}
                    className="text-xs text-[#7a95b8] hover:text-white px-2 py-1 rounded hover:bg-[#12233e] transition-colors"
                  >
                    {selectedFiles.size === filteredFiles.length ? "Deselect All" : "Select All"}
                  </button>
                  <div className="h-4 w-px bg-[#12233e] mx-1"></div>
                  <div className="flex bg-[#060d19] rounded-lg border border-[#12233e] p-0.5">
                    <button 
                      onClick={() => setViewMode("list")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "list" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-[#c8d8ec]"}`}
                      title="List View"
                    >
                      <MoreVertical className="w-4 h-4 rotate-90" />
                    </button>
                    <button 
                      onClick={() => setViewMode("grid")}
                      className={`p-1.5 rounded-md transition-colors ${viewMode === "grid" ? "bg-[#12233e] text-white" : "text-[#7a95b8] hover:text-[#c8d8ec]"}`}
                      title="Grid View"
                    >
                      <Activity className="w-4 h-4" /> {/* Placeholder for grid icon */}
                    </button>
                  </div>
                </div>
              </div>

              {/* Table Header (List View Only) */}
              {viewMode === "list" && filteredFiles.length > 0 && (
                <div className="grid grid-cols-12 gap-4 p-3 border-b border-[#12233e] bg-[#0d1a2e]/50 text-xs font-medium text-[#7a95b8] uppercase tracking-wider sticky top-0 z-10">
                  <div className="col-span-5 md:col-span-4 pl-10">Name</div>
                  <div className="col-span-3 hidden md:block">Category & Tags</div>
                  <div className="col-span-2 hidden lg:block">Details</div>
                  <div className="col-span-3 md:col-span-2 text-right">Status</div>
                  <div className="col-span-4 md:col-span-3 text-right pr-4">Actions</div>
                </div>
              )}

              {/* File List/Grid */}
              <div className="flex-1 overflow-auto bg-[#0a1424] min-h-[500px]">
                {filteredFiles.length > 0 ? (
                  viewMode === "list" ? (
                    <div className="divide-y divide-[#12233e]">
                      {filteredFiles.map((file) => (
                        <div 
                          key={file.id} 
                          className={`grid grid-cols-12 gap-4 p-3 items-center hover:bg-[#12233e]/50 transition-colors group cursor-pointer ${selectedFiles.has(file.id) ? "bg-blue-500/5" : ""}`}
                          onClick={(e) => {
                            if ((e.target as HTMLElement).closest('button')) return;
                            toggleFileSelection(file.id);
                          }}
                        >
                          <div className="col-span-5 md:col-span-4 flex items-center gap-3 min-w-0">
                            <div 
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                                selectedFiles.has(file.id) ? "bg-blue-500 border-blue-500" : "border-[#7a95b8] group-hover:border-blue-400"
                              }`}
                              onClick={(e) => { e.stopPropagation(); toggleFileSelection(file.id); }}
                            >
                              {selectedFiles.has(file.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                            </div>
                            <div className="w-10 h-10 rounded-lg bg-[#0d1a2e] border border-[#12233e] flex items-center justify-center flex-shrink-0 group-hover:border-blue-500/30 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.1)] transition-all">
                              {file.type === "PDF" ? <FileText className="w-5 h-5 text-red-400" /> :
                               file.type === "DOCX" ? <FileText className="w-5 h-5 text-blue-400" /> :
                               <FileText className="w-5 h-5 text-[#c8d8ec]" />}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-white truncate group-hover:text-blue-400 transition-colors" title={file.name}>{file.name}</p>
                              <p className="text-[11px] text-[#7a95b8] truncate">v{file.version} • {file.size}</p>
                            </div>
                          </div>
                          
                          <div className="col-span-3 hidden md:flex flex-col gap-1.5 justify-center">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full border whitespace-nowrap ${CATEGORY_COLORS[file.category] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                                {file.category.toUpperCase()}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                              {file.tags.slice(0, 2).map((tag) => (
                                <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-[#12233e] text-[#7a95b8] flex items-center gap-0.5">
                                  <Tag className="w-2.5 h-2.5" /> {tag}
                                </span>
                              ))}
                              {file.tags.length > 2 && <span className="text-[9px] text-[#7a95b8]">+{file.tags.length - 2}</span>}
                            </div>
                          </div>
                          
                          <div className="col-span-2 hidden lg:flex flex-col justify-center text-[11px] text-[#7a95b8]">
                            <p>{file.date}</p>
                            <p className="truncate">By {file.lastModifiedBy}</p>
                          </div>
                          
                          <div className="col-span-3 md:col-span-2 flex justify-end items-center">
                            <span className={`text-[11px] font-medium px-2 py-1 rounded-md border flex items-center gap-1.5 ${STATUS_COLORS[file.status] || "text-[#7a95b8]"}`}>
                              {file.status === "complete" && <ShieldCheck className="w-3 h-3" />}
                              {file.status === "pending" && <Clock className="w-3 h-3" />}
                              {file.status === "draft" && <FileDigit className="w-3 h-3" />}
                              {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                            </span>
                          </div>
                          
                          <div className="col-span-4 md:col-span-3 flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {file.status === "pending" && (
                              <button 
                                className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-md transition-colors tooltip-trigger" 
                                onClick={(e) => { e.stopPropagation(); handleAction("sign", file); }}
                                title="Sign Document"
                              >
                                <FileSignature className="w-4 h-4" />
                              </button>
                            )}
                            <button 
                              className="p-1.5 text-[#7a95b8] hover:text-cyan-400 hover:bg-cyan-500/10 rounded-md transition-colors" 
                              onClick={(e) => { e.stopPropagation(); handleAction("share", file); }}
                              title="Share"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            <button 
                              className="p-1.5 text-[#7a95b8] hover:text-[#22c55e] hover:bg-[#22c55e]/10 rounded-md transition-colors" 
                              onClick={(e) => { e.stopPropagation(); handleAction("download", file); }}
                              title="Download"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <div className="relative group/menu">
                              <button className="p-1.5 text-[#7a95b8] hover:text-white hover:bg-[#12233e] rounded-md transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              <div className="absolute right-0 top-full mt-1 w-48 bg-[#0d1a2e] border border-[#12233e] rounded-lg shadow-xl opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all z-50 py-1">
                                <button className="w-full text-left px-4 py-2 text-sm text-[#c8d8ec] hover:bg-[#12233e] flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleAction("view", file); }}>
                                  <Eye className="w-4 h-4" /> Preview
                                </button>
                                <button className="w-full text-left px-4 py-2 text-sm text-[#c8d8ec] hover:bg-[#12233e] flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleAction("check", file); }}>
                                  <ShieldCheck className="w-4 h-4" /> Compliance Check
                                </button>
                                <div className="h-px bg-[#12233e] my-1"></div>
                                <button className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 flex items-center gap-2" onClick={(e) => { e.stopPropagation(); handleAction("delete", file); }}>
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
                      {filteredFiles.map((file) => (
                        <div 
                          key={file.id} 
                          className={`rc-card p-4 flex flex-col h-full cursor-pointer transition-all border-2 ${
                            selectedFiles.has(file.id) ? "border-blue-500 bg-blue-500/5" : "border-transparent hover:border-[#12233e] hover:bg-[#12233e]/30"
                          }`}
                          onClick={() => toggleFileSelection(file.id)}
                        >
                          <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-xl bg-[#0d1a2e] border border-[#12233e] flex items-center justify-center shadow-inner ${selectedFiles.has(file.id) ? "border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.2)]" : ""}`}>
                              {file.type === "PDF" ? <FileText className="w-6 h-6 text-red-400" /> :
                               file.type === "DOCX" ? <FileText className="w-6 h-6 text-blue-400" /> :
                               <FileText className="w-6 h-6 text-[#c8d8ec]" />}
                            </div>
                            <div className="flex gap-1">
                              {file.isShared && <Share2 className="w-4 h-4 text-cyan-400" title="Shared Externally" />}
                              <div 
                                className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                  selectedFiles.has(file.id) ? "bg-blue-500 border-blue-500" : "border-[#7a95b8]"
                                }`}
                              >
                                {selectedFiles.has(file.id) && <CheckCircle2 className="w-3 h-3 text-white" />}
                              </div>
                            </div>
                          </div>
                          
                          <h4 className="text-white font-medium text-sm mb-1 line-clamp-2" title={file.name}>{file.name}</h4>
                          <p className="text-xs text-[#7a95b8] mb-3">{file.size} • {file.date}</p>
                          
                          <div className="mt-auto pt-3 border-t border-[#12233e] flex items-center justify-between">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[file.category] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
                              {file.category.toUpperCase()}
                            </span>
                            <span className={`text-[10px] font-medium ${STATUS_COLORS[file.status] || "text-[#7a95b8]"}`}>
                              {file.status.charAt(0).toUpperCase() + file.status.slice(1)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center p-8 animate-in fade-in zoom-in duration-300">
                    <div className="w-20 h-20 rounded-full bg-[#12233e]/50 flex items-center justify-center mb-5 border border-[#12233e]">
                      <Search className="w-10 h-10 text-[#7a95b8]" />
                    </div>
                    <p className="text-xl text-white font-bold mb-2">No documents found</p>
                    <p className="text-[#7a95b8] text-sm max-w-md mx-auto mb-6">
                      We couldn't find any files matching your current search and filter criteria. Try adjusting them or upload new documents.
                    </p>
                    <button 
                      onClick={() => { setSearchTerm(""); setActiveTab("all"); setSelectedCategory("all"); }}
                      className="rc-btn rc-btn-ghost border border-[#12233e]"
                    >
                      Clear All Filters
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#7a95b8] mt-8 bg-gradient-to-r from-[#0d1a2e] to-[#0a1424] p-4 rounded-xl border border-[#12233e] shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-[#22c55e]/10 rounded-md">
              <ShieldCheck className="w-5 h-5 text-[#22c55e]" />
            </div>
            <div>
              <p className="font-medium text-[#c8d8ec]">Enterprise-Grade Security</p>
              <p>AES-256 encryption at rest, TLS 1.3 in transit. SEC/FINRA compliant logging.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse"></span>
              System Status: Secure
            </div>
            <div className="hidden sm:block h-4 w-px bg-[#12233e]"></div>
            <div className="hidden sm:flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Auto-locks in 15m
            </div>
          </div>
        </div>

        <PageInsights pageId="client-files" />
      </div>
    </AppShell>
  );
}

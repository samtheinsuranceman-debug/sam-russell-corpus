// @ts-nocheck
import { AppShell } from "@/components/AppShell";
import { trpc } from "@/lib/trpc";
import { useState, useRef, useCallback, useMemo } from "react";
import { Plus, X, Search, BookOpen, FileText, Upload, Paperclip, ExternalLink, Eye, BarChart3 } from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Streamdown } from "@/components/StreamdownLite";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { ExportToSlides } from "@/components/ExportToSlides";

const DOC_TYPES = [
  "MESSAGING_LIBRARY", "OBJECTION_GUIDE", "OFFER_POSITIONING",
  "RENEWAL_POSITIONING", "TONE_RULE", "COMPLIANCE_RULE", "PLAYBOOK_GUIDANCE",
] as const;

type DocType = typeof DOC_TYPES[number];
type DocForm = { title: string; docType: DocType; summary: string; content: string; versionLabel: string };

function useAIKnowledgeQuery() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const chatMut = trpc.ai.advisorChat.useMutation();
  const ask = useCallback(async (q: string) => {
    if (!q.trim()) return;
    setQuery(q);
    setLoading(true);
    setAnswer("");
    try {
      const res = await chatMut.mutateAsync({ messages: [{ role: "user", content: `Search my knowledge base and answer: ${q}` }] });
      setAnswer(res.reply);
    } catch {
      setAnswer("Sorry, I couldn't process that query. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [chatMut]);
  return { query, setQuery, answer, loading, ask, clearAnswer: () => setAnswer("") };
}

function AddDocModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<DocForm>({ defaultValues: { docType: "PLAYBOOK_GUIDANCE" } });
  const createMut = trpc.knowledge.create.useMutation({
    onSuccess: () => { toast.success("Document added"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });
  const onSubmit = (data: DocForm) => {
    createMut.mutate({
      title: data.title,
      docType: data.docType,
      summary: data.summary || undefined,
      content: data.content || undefined,
      versionLabel: data.versionLabel || undefined,
    });
  };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rc-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Add Text Document</h2>
          <button onClick={onClose} className="rc-btn rc-btn-ghost p-1"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="rc-label">Title *</label>
            <input className="rc-input" {...register("title", { required: true })} placeholder="Roth Conversion Objection Handling" />
            {errors.title && <p className="text-xs text-red-400 mt-1">Required</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="rc-label">Document Type</label>
              <select className="rc-input" {...register("docType")}>
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
            <div>
              <label className="rc-label">Version Label</label>
              <input className="rc-input" {...register("versionLabel")} placeholder="v1.0" />
            </div>
          </div>
          <div>
            <label className="rc-label">Summary</label>
            <textarea className="rc-input" rows={2} {...register("summary")} placeholder="Brief description..." />
          </div>
          <div>
            <label className="rc-label">Full Content</label>
            <textarea className="rc-input" rows={6} {...register("content")} placeholder="Full document text, scripts, or reference material..." />
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="rc-btn rc-btn-ghost flex-1">Cancel</button>
            <button type="submit" disabled={createMut.isPending} className="rc-btn rc-btn-primary flex-1">
              {createMut.isPending ? "Saving..." : "Add Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const MAX_FILE_SIZE_MB = 16;

function UploadDocModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [title, setTitle] = useState("");
  const [docType, setDocType] = useState<DocType>("PLAYBOOK_GUIDANCE");
  const [summary, setSummary] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadMut = trpc.knowledge.upload.useMutation({
    onSuccess: () => { toast.success("Document uploaded successfully"); onSuccess(); onClose(); },
    onError: (e) => toast.error(e.message),
  });

  const handleFile = (f: File) => {
    if (f.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      toast.error(`File too large. Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSubmit = async () => {
    if (!file || !title.trim()) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      uploadMut.mutate({
        title: title.trim(),
        docType,
        summary: summary.trim() || undefined,
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        fileDataBase64: base64,
        fileSize: file.size,
      });
    };
    reader.readAsDataURL(file);
  };

  const formatSize = (bytes: number) =>
    bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${(bytes / 1024).toFixed(0)} KB`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rc-card w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-white font-bold text-lg">Upload Document</h2>
          <button onClick={onClose} className="rc-btn rc-btn-ghost p-1"><X size={18} /></button>
        </div>

        <div className="space-y-4">
          {/* Drop zone */}
          <div
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
              dragOver ? "border-[#22c55e] bg-[#22c55e]/5" : "border-[#12233e] hover:border-[#22c55e]/50"
            }`}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept=".pdf,.doc,.docx,.txt,.md,.csv,.xlsx,.pptx"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-3">
                <Paperclip size={20} className="text-[#22c55e]" />
                <div className="text-left">
                  <div className="text-white font-medium text-sm">{file.name}</div>
                  <div className="text-xs text-[#7a95b8]">{formatSize(file.size)}</div>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 text-[#7a95b8] hover:text-red-400"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <>
                <Upload size={28} className="mx-auto mb-2 text-[#7a95b8] opacity-60" />
                <p className="text-sm text-[#7a95b8]">Drop a file here or <span className="text-[#22c55e]">click to browse</span></p>
                <p className="text-xs text-[#7a95b8] mt-1">PDF, Word, TXT, Markdown, CSV, Excel, PowerPoint · Max {MAX_FILE_SIZE_MB} MB</p>
              </>
            )}
          </div>

          <div>
            <label className="rc-label">Title *</label>
            <input
              className="rc-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Document title"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="rc-label">Document Type</label>
              <select className="rc-input" value={docType} onChange={(e) => setDocType(e.target.value as DocType)}>
                {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="rc-label">Summary (optional)</label>
            <textarea
              className="rc-input"
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Brief description of this document..."
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="rc-btn rc-btn-ghost flex-1">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={!file || !title.trim() || uploadMut.isPending}
              className="rc-btn rc-btn-primary flex-1"
            >
              {uploadMut.isPending ? (
                <span className="flex items-center gap-2"><span className="animate-spin inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full" /> Uploading...</span>
              ) : (
                <><Upload size={14} /> Upload</>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocViewerModal({ doc, onClose }: { doc: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="rc-card w-full max-w-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-4 shrink-0">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="rc-badge rc-badge-blue">{doc.docType.replace(/_/g, " ")}</span>
              {doc.versionLabel && <span className="text-xs text-[#7a95b8]">v{doc.versionLabel}</span>}
              <span className="text-xs text-[#7a95b8]">{new Date(doc.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="text-white font-bold text-lg">{doc.title}</div>
            {doc.summary && <p className="text-sm text-[#c8d8ec] mt-1 leading-relaxed">{doc.summary}</p>}
          </div>
          <button onClick={onClose} className="rc-btn rc-btn-ghost p-1 shrink-0"><X size={18} /></button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto border-t border-[#12233e] pt-4">
          {doc.content ? (
            <div className="prose prose-invert prose-sm max-w-none text-[#c8d8ec] leading-relaxed">
              <Streamdown>{doc.content}</Streamdown>
            </div>
          ) : (
            <div className="text-center py-8 text-[#7a95b8] text-sm">
              <FileText size={28} className="mx-auto mb-2 opacity-40" />
              <p>This document has no inline text content.</p>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-[#12233e] shrink-0">
          <div className="text-xs text-[#7a95b8]">
            {doc.fileUrl && (
              <span className="flex items-center gap-1">
                <Paperclip size={10} />
                {doc.fileMime?.includes("pdf") ? "PDF" : doc.fileMime?.includes("word") ? "Word" : "File"}
                {doc.fileSize && ` · ${doc.fileSize >= 1024 * 1024 ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : `${(doc.fileSize / 1024).toFixed(0)} KB`}`}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            {doc.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rc-btn rc-btn-secondary text-sm"
              >
                <ExternalLink size={12} /> Download File
              </a>
            )}
            <button onClick={onClose} className="rc-btn rc-btn-ghost text-sm">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocCard({ doc, onView }: { doc: any; onView: () => void }) {
  return (
    <div className="rc-card cursor-pointer hover:border-[#22c55e]/30 transition-colors" onClick={onView}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="rc-badge rc-badge-blue">{doc.docType.replace(/_/g, " ")}</span>
            {doc.versionLabel && <span className="text-xs text-[#7a95b8]">v{doc.versionLabel}</span>}
            <span className="text-xs text-[#7a95b8]">{new Date(doc.createdAt).toLocaleDateString()}</span>
            {doc.fileUrl && (
              <span className="flex items-center gap-1 text-xs text-[#22c55e]">
                <Paperclip size={10} />
                {doc.fileMime?.includes("pdf") ? "PDF" : doc.fileMime?.includes("word") ? "Word" : "File"}
                {doc.fileSize && ` · ${doc.fileSize >= 1024 * 1024 ? `${(doc.fileSize / 1024 / 1024).toFixed(1)} MB` : `${(doc.fileSize / 1024).toFixed(0)} KB`}`}
              </span>
            )}
          </div>
          <div className="text-white font-semibold">{doc.title}</div>
          {doc.summary && <p className="text-xs text-[#c8d8ec] mt-1 leading-relaxed">{doc.summary}</p>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {doc.fileUrl && (
            <a
              href={doc.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rc-btn rc-btn-ghost p-1"
              title="Open file"
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={14} />
            </a>
          )}
          <button onClick={onView} className="rc-btn rc-btn-ghost p-1" title="View document">
            <Eye size={14} />
          </button>
        </div>
      </div>
      {doc.content && (
        <p className="text-xs text-[#7a95b8] mt-2 line-clamp-2">{doc.content.slice(0, 200)}{doc.content.length > 200 ? "..." : ""}</p>
      )}
    </div>
  );
}

function AIKnowledgeQuerySection() {
  const { query, setQuery, answer, loading, ask, clearAnswer } = useAIKnowledgeQuery();
  const inputRef = useRef<HTMLInputElement>(null);
  const SUGGESTED = ["What are our top messaging points?", "Summarize compliance rules", "How to handle rate objections?"];
  return (
    <div className="px-6 pt-4">
      <div className="rc-card border-purple-500/20 bg-purple-500/5">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen size={18} className="text-purple-400" />
          <span className="text-white font-semibold">Ask Your Knowledge Base</span>
          <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">AI</span>
        </div>
        <p className="text-xs text-[#7a95b8] mb-3">Ask questions in plain English and get answers sourced from your uploaded documents.</p>
        <div className="flex gap-2">
          <input ref={inputRef} className="rc-input flex-1" placeholder='Try: "What objections do clients have about surrender charges?"' value={query} onChange={(e) => { setQuery(e.target.value); clearAnswer(); }} onKeyDown={e => e.key === "Enter" && ask(query)} />
          <button className="rc-btn rc-btn-primary text-sm whitespace-nowrap" disabled={loading} onClick={() => ask(query)}>
            {loading ? <span className="animate-pulse">Thinking...</span> : <><Search size={14} /> Ask AI</>}
          </button>
        </div>
        <div className="flex gap-2 mt-2 flex-wrap">
          {SUGGESTED.map((q, i) => (
            <button key={i} className="text-xs px-2 py-1 rounded-full border border-purple-500/20 text-purple-300 hover:bg-purple-500/10 transition-colors" onClick={() => { setQuery(q); ask(q); }}>{q}</button>
          ))}
        </div>
        {answer && (
          <div className="mt-4 p-4 rounded-lg bg-[#0a1628] border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-purple-400 font-medium">AI Answer</span>
              <button className="text-xs text-muted-foreground hover:text-white" onClick={clearAnswer}><X size={14} /></button>
            </div>
            <div className="text-sm text-[#c8d6e5] leading-relaxed"><Streamdown>{answer}</Streamdown></div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Knowledge() {
  const utils = trpc.useUtils();
  const [showAdd, setShowAdd] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("ALL");

  const docsQuery = trpc.knowledge.list.useQuery(undefined, { staleTime: 30_000 });
  const docs = docsQuery.data ?? [];

  const filtered = docs.filter((d) => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.summary ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "ALL" || d.docType === filterType;
    return matchSearch && matchType;
  });

  const handleSuccess = () => utils.knowledge.list.invalidate();

  return (
    <AppShell>
      {showAdd && <AddDocModal onClose={() => setShowAdd(false)} onSuccess={handleSuccess} />}
      {showUpload && <UploadDocModal onClose={() => setShowUpload(false)} onSuccess={handleSuccess} />}
      {viewDoc && <DocViewerModal doc={viewDoc} onClose={() => setViewDoc(null)} />}

      <div className="rc-page-header">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/12 border border-purple-500/20 flex items-center justify-center">
              <BookOpen size={18} className="text-[#a78bfa]" />
            </div>
            <div>
              <h1 className="rc-page-title">Knowledge Library</h1>
              <p className="rc-page-subtitle">{docs.length} document{docs.length !== 1 ? "s" : ""} · Searchable by Strategy Assist</p>
            </div>
          </div>
          <div className="flex gap-2">
            <ExportToSlides
              toolName="Knowledge Library"
              getSections={() => [
                {
                  title: "Knowledge Library",
                  items: [
                    { label: "Total Documents", value: docs.length.toString() },
                    { label: "Filtered Documents", value: filtered.length.toString() },
                  ],
                },
              ]}
            />
            <button onClick={() => setShowUpload(true)} className="rc-btn rc-btn-secondary text-sm">
              <Upload size={14} /> Upload File
            </button>
            <button onClick={() => setShowAdd(true)} className="rc-btn rc-btn-primary text-sm">
              <Plus size={14} /> Add Text Doc
            </button>
          </div>
        </div>
      </div>

      {/* AI Ask Your Data */}
      <AIKnowledgeQuerySection />

      {/* Analytics Section */}
      {docs.length > 0 && (
        <div className="px-6 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rc-card">
              <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart3 size={14} className="text-[#22c55e]" /> Documents by Type
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={(() => {
                      const counts: Record<string, number> = {};
                      docs.forEach((d) => { counts[d.docType] = (counts[d.docType] || 0) + 1; });
                      return Object.entries(counts).map(([name, value]) => ({ name: name.replace(/_/g, " "), value }));
                    })()}
                    cx="50%" cy="50%" innerRadius={50} outerRadius={80}
                    paddingAngle={3} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {["#22c55e", "#a78bfa", "#f0c040", "#3b82f6", "#ef4444", "#ec4899", "#06b6d4"].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rc-card">
              <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BookOpen size={14} className="text-[#a78bfa]" /> Documents Added Over Time
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={(() => {
                    const months: Record<string, number> = {};
                    docs.forEach((d) => {
                      const m = new Date(d.createdAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                      months[m] = (months[m] || 0) + 1;
                    });
                    return Object.entries(months).slice(-8).map(([name, count]) => ({ name, count }));
                  })()}
                  margin={{ top: 5, right: 10, bottom: 5, left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                  <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  <Bar dataKey="count" name="Documents" fill="#a78bfa" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="px-6 pb-8 space-y-5">
        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#7a95b8]" />
            <input className="rc-input pl-9" placeholder="Search documents..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <select className="rc-input w-auto" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="ALL">All Types</option>
            {DOC_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
          </select>
        </div>

        {/* Documents */}
        {filtered.length === 0 ? (
          <div className="rc-card text-center py-12">
            <FileText size={32} className="text-[#7a95b8] mx-auto mb-3 opacity-40" />
            <div className="text-[#7a95b8] text-sm">{search || filterType !== "ALL" ? "No documents match your filters." : "No documents yet. Add a text document or upload a file."}</div>
            <div className="flex gap-3 justify-center mt-4">
              <button onClick={() => setShowUpload(true)} className="rc-btn rc-btn-secondary text-sm"><Upload size={14} /> Upload File</button>
              <button onClick={() => setShowAdd(true)} className="rc-btn rc-btn-primary text-sm"><Plus size={14} /> Add Text Doc</button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((doc) => <DocCard key={doc.id} doc={doc} onView={() => setViewDoc(doc)} />)}
          </div>
        )}
      </div>
    </AppShell>
  );
}

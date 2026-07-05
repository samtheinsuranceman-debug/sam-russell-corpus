import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useState, useRef, useCallback } from "react";
import {
  Upload, FileText, Image, Video, Check, X, ArrowLeft, Shield,
  Brain, Lightbulb, Users, Compass, Zap, BookOpen, Award,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { playClick } from "@/lib/audio";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";
import { ALL_AXES } from "@shared/axisModes";

// ============================================================
// EVIDENCE VAULT V2 — Premium Portal Aesthetic
// Dark glass, gold accents, category-first navigation
// ============================================================

const EVIDENCE_CATEGORIES = [
  {
    id: "cognitive",
    icon: Brain,
    title: "Cognitive Artifacts",
    desc: "Published papers, patents, research, complex problem solutions",
    axes: [0, 1, 2, 9, 10, 14],
    color: "oklch(0.68 0.08 165)",
  },
  {
    id: "creative",
    icon: Lightbulb,
    title: "Creative Works",
    desc: "Art, music, writing, design portfolios, inventions",
    axes: [2, 3, 6, 16],
    color: "oklch(0.78 0.12 85)",
  },
  {
    id: "interpersonal",
    icon: Users,
    title: "Leadership & Influence",
    desc: "Team outcomes, mentoring, community building, public speaking",
    axes: [4, 5, 15, 21],
    color: "oklch(0.78 0.12 85)",
  },
  {
    id: "strategic",
    icon: Compass,
    title: "Strategic Decisions",
    desc: "Business outcomes, investment returns, career pivots, risk management",
    axes: [9, 10, 11, 13],
    color: "oklch(0.7 0.15 160)",
  },
  {
    id: "performance",
    icon: Zap,
    title: "Performance Records",
    desc: "Athletic achievements, competition results, speed/accuracy metrics",
    axes: [7, 11, 12],
    color: "oklch(0.75 0.18 30)",
  },
  {
    id: "academic",
    icon: BookOpen,
    title: "Academic & Certifications",
    desc: "Degrees, certifications, test scores, fellowships, honors",
    axes: [0, 1, 3, 17, 18],
    color: "oklch(0.65 0.15 280)",
  },
  {
    id: "recognition",
    icon: Award,
    title: "External Recognition",
    desc: "Awards, press coverage, peer nominations, industry rankings",
    axes: [4, 19, 20, 21],
    color: "oklch(0.78 0.12 85)",
  },
];

const AXIS_LABELS = ALL_AXES;

function getFileIcon(type: string) {
  if (type.startsWith("image")) return Image;
  if (type.startsWith("video")) return Video;
  return FileText;
}

// ============================================================
// VERIFICATION TIERS
// ============================================================
const VERIFICATION_TIERS = [
  { name: "Foundational", min: 0, color: "oklch(0.6 0.1 240)" },
  { name: "Verified", min: 3, color: "oklch(0.7 0.15 160)" },
  { name: "Comprehensive", min: 7, color: "oklch(0.78 0.12 85)" },
  { name: "Elite", min: 12, color: "oklch(0.85 0.18 85)" },
];

function getVerificationTier(count: number) {
  for (let i = VERIFICATION_TIERS.length - 1; i >= 0; i--) {
    if (count >= VERIFICATION_TIERS[i].min) return { tier: VERIFICATION_TIERS[i], index: i };
  }
  return { tier: VERIFICATION_TIERS[0], index: 0 };
}

// ============================================================
// UPLOAD PANEL — Appears after selecting a category
// Now supports batch upload (multiple files) + tagging
// ============================================================
function UploadPanel({
  category,
  assessmentId,
  onClose,
}: {
  category: typeof EVIDENCE_CATEGORIES[0];
  assessmentId: number;
  onClose: () => void;
}) {
  const utils = trpc.useUtils();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [description, setDescription] = useState("");
  const [institution, setInstitution] = useState("");
  const [evidenceDate, setEvidenceDate] = useState("");
  const [significance, setSignificance] = useState("");
  const [selectedAxes, setSelectedAxes] = useState<number[]>(category.axes);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const uploadEvidence = trpc.evidence.upload.useMutation({
    onError: (err) => {
      toast.error("Upload failed: " + err.message);
    },
  });

  const handleFilesSelect = useCallback((files: FileList | File[]) => {
    const valid: File[] = [];
    Array.from(files).forEach(f => {
      if (f.size > 16 * 1024 * 1024) {
        toast.error(`${f.name} exceeds 16MB limit`);
      } else {
        valid.push(f);
      }
    });
    setSelectedFiles(prev => [...prev, ...valid]);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) handleFilesSelect(e.dataTransfer.files);
  }, [handleFilesSelect]);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const toggleAxis = useCallback((index: number) => {
    setSelectedAxes(prev =>
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    );
  }, []);

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress(0);
    try {
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const base64 = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(file);
        });
        await uploadEvidence.mutateAsync({
          assessmentId,
          fileBase64: base64,
          fileName: file.name,
          fileType: file.type,
          description: description || undefined,
          axisTargets: selectedAxes.length > 0 ? selectedAxes : undefined,
          category: category.id,
          institution: institution || undefined,
          evidenceDate: evidenceDate || undefined,
          significance: significance || undefined,
        });
        setUploadProgress(i + 1);
      }
      toast.success(`${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""} secured in vault.`);
      utils.evidence.list.invalidate();
      setSelectedFiles([]);
      setDescription("");
      setInstitution("");
      setEvidenceDate("");
      setSignificance("");
      onClose();
    } catch {
      // error handled by mutation onError
    } finally {
      setIsUploading(false);
    }
  }, [selectedFiles, description, selectedAxes, category.id, institution, evidenceDate, significance, uploadEvidence, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="glass-card rounded-2xl p-8 border border-primary/10"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `color-mix(in oklch, ${category.color} 15%, transparent)` }}
          >
            <category.icon className="w-5 h-5" style={{ color: category.color }} />
          </div>
          <div>
            <h3 className="text-foreground font-semibold">{category.title}</h3>
            <p className="text-muted-foreground/50 text-xs">{category.desc}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-muted-foreground/40 hover:text-foreground transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        multiple
        accept=".pdf,.png,.jpg,.jpeg,.gif,.mp4,.webm,.doc,.docx"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) handleFilesSelect(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Drop Zone — always visible for batch adds */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-300 mb-5 ${
          dragOver
            ? "border-primary/60 bg-primary/[0.04]"
            : "border-muted/20 hover:border-primary/30 hover:bg-primary/[0.02]"
        }`}
      >
        <div className="w-10 h-10 rounded-full bg-primary/[0.08] flex items-center justify-center mx-auto mb-2">
          <Upload className="w-4 h-4 text-primary/60" />
        </div>
        <p className="text-foreground/70 text-sm">Drop files or click to add</p>
        <p className="text-muted-foreground/30 text-xs mt-1">Multiple files supported — max 16MB each</p>
      </div>

      {/* File List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2 mb-5">
          {selectedFiles.map((file, i) => {
            const Icon = getFileIcon(file.type);
            return (
              <div key={`${file.name}-${i}`} className="flex items-center gap-3 p-3 rounded-lg bg-muted/10 border border-primary/10">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-foreground font-medium truncate text-xs">{file.name}</p>
                  <p className="text-muted-foreground/50 text-[10px]">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
                {isUploading && i < uploadProgress ? (
                  <Check className="w-4 h-4 text-green-400" />
                ) : (
                  <button onClick={() => removeFile(i)} className="text-muted-foreground/40 hover:text-red-400 transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {selectedFiles.length > 0 && (
        <div className="space-y-4">
          {/* Tagging Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-muted-foreground/50 mb-1 block uppercase tracking-wider">Institution</label>
              <input
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder="e.g. MIT, Google, self"
                className="w-full bg-muted/10 border border-muted/20 rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/30 transition-all duration-200"
              />
            </div>
            <div>
              <label className="text-[10px] text-muted-foreground/50 mb-1 block uppercase tracking-wider">Date</label>
              <input
                value={evidenceDate}
                onChange={(e) => setEvidenceDate(e.target.value)}
                placeholder="YYYY or YYYY-MM-DD"
                className="w-full bg-muted/10 border border-muted/20 rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/30 transition-all duration-200"
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground/50 mb-1 block uppercase tracking-wider">Significance</label>
            <input
              value={significance}
              onChange={(e) => setSignificance(e.target.value)}
              placeholder="Why does this matter? (one sentence)"
              className="w-full bg-muted/10 border border-muted/20 rounded-lg px-3 py-2 text-foreground text-xs placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/30 transition-all duration-200"
            />
          </div>

          <div>
            <label className="text-[10px] text-muted-foreground/50 mb-1 block uppercase tracking-wider">Context</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Additional context about what this evidence demonstrates..."
              className="w-full bg-muted/10 border border-muted/20 rounded-xl px-3 py-2.5 text-foreground text-xs placeholder:text-muted-foreground/25 focus:outline-none focus:border-primary/30 focus:ring-1 focus:ring-primary/10 resize-none transition-all duration-200"
              rows={2}
            />
          </div>

          {/* Axis Selection */}
          <div>
            <label className="text-[10px] text-muted-foreground/50 mb-1.5 block uppercase tracking-wider">
              Relevant Axes
            </label>
            <div className="flex flex-wrap gap-1.5">
              {AXIS_LABELS.map((label, i) => (
                <button
                  key={i}
                  onClick={() => toggleAxis(i)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-all duration-200 ${
                    selectedAxes.includes(i)
                      ? "bg-primary/15 border border-primary/40 text-primary"
                      : "bg-muted/10 border border-muted/15 text-muted-foreground/40 hover:border-primary/20"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Upload Progress */}
          {isUploading && (
            <div className="space-y-1">
              <div className="w-full h-1.5 rounded-full bg-muted/20 overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${(uploadProgress / selectedFiles.length) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground/40 text-center">
                {uploadProgress} / {selectedFiles.length} files uploaded
              </p>
            </div>
          )}

          {/* Submit */}
          <Button
            onClick={handleUpload}
            disabled={isUploading}
            className="w-full py-4 text-sm bg-primary/90 text-background font-semibold hover:bg-primary hover:translate-y-[-1px] active:scale-[0.97] transition-all duration-150"
          >
            {isUploading ? (
              <motion.span animate={{ opacity: [1, 0.5, 1] }} transition={{ duration: 1.5, repeat: Infinity }}>
                Securing in Vault...
              </motion.span>
            ) : (
              `Submit ${selectedFiles.length} File${selectedFiles.length > 1 ? "s" : ""} to Vault`
            )}
          </Button>
        </div>
      )}
    </motion.div>
  );
}

// ============================================================
// MAIN EVIDENCE VAULT PAGE
// ============================================================
export default function Evidence() {
  useScrollReveal();
  const { user } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<typeof EVIDENCE_CATEGORIES[0] | null>(null);

  // Get current assessment
  const { data: assessment } = trpc.assessment.current.useQuery(undefined, { enabled: !!user });
  const assessmentId = assessment?.id ?? 0;

  // Fetch evidence count for verification tier
  const { data: evidenceList } = trpc.evidence.list.useQuery(
    { assessmentId },
    { enabled: !!user && assessmentId > 0 }
  );
  const evidenceCount = evidenceList?.length ?? 0;
  const { tier: currentTier, index: tierIndex } = getVerificationTier(evidenceCount);
  const nextTier = VERIFICATION_TIERS[tierIndex + 1];
  const progressToNext = nextTier
    ? ((evidenceCount - currentTier.min) / (nextTier.min - currentTier.min)) * 100
    : 100;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background — darker, vault-like */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 50% 20%, oklch(0.14 0.02 260) 0%, oklch(0.11 0.02 260) 60%, oklch(0.09 0.01 260) 100%)`,
        }}
      />
      {/* Gold accent glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[60%] h-[1px] bg-gradient-to-r from-transparent via-primary/20 to-transparent pointer-events-none" />

      <PublicHeader />

      {/* Main Content */}
      <main className="relative z-10 container section-spacing max-w-3xl px-4">
        {/* Hero */}
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
        >
          <div className="w-16 h-16 rounded-full bg-primary/[0.08] border border-primary/20 flex items-center justify-center mx-auto mb-6">
            <Shield className="w-8 h-8 text-primary/80" />
          </div>
          <h1
            className="text-3xl sm:text-4xl text-foreground mb-3"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            Your Evidence Vault
          </h1>
          <p className="text-muted-foreground/60 max-w-lg mx-auto leading-relaxed text-sm">
            Submit artifacts that demonstrate your capabilities. Each piece of evidence is reviewed
            and can increase your axis scores and composite rarity placement.
          </p>
        </motion.div>

        {/* Category Grid */}
        {!selectedCategory ? (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12"
            initial="hidden"
            animate="visible"
            variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
          >
            {EVIDENCE_CATEGORIES.map((cat) => (
              <motion.button
                key={cat.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.23, 1, 0.32, 1] } },
                }}
                onClick={() => { playClick(); setSelectedCategory(cat); }}
                className="glass-card rounded-xl p-6 text-left group hover:border-primary/20 transition-all duration-200 hover:translate-y-[-2px] active:scale-[0.98]"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-200 group-hover:scale-105"
                    style={{ backgroundColor: `color-mix(in oklch, ${cat.color} 10%, transparent)` }}
                  >
                    <cat.icon className="w-5 h-5" style={{ color: cat.color }} />
                  </div>
                  <div>
                    <h3 className="text-foreground font-medium text-sm mb-1">{cat.title}</h3>
                    <p className="text-muted-foreground/40 text-xs leading-relaxed">{cat.desc}</p>
                  </div>
                </div>
              </motion.button>
            ))}
          </motion.div>
        ) : (
          <div className="mb-12">
            <UploadPanel category={selectedCategory} assessmentId={assessmentId} onClose={() => setSelectedCategory(null)} />
          </div>
        )}

        {/* Verification Tier Progress */}
        {user && (
          <motion.div
            className="glass-card rounded-xl p-6 mb-10 border border-primary/10"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4" style={{ color: currentTier.color }} />
                <span className="text-xs font-semibold text-foreground">{currentTier.name} Verification</span>
              </div>
              <span className="text-[10px] text-muted-foreground/50">
                {evidenceCount} artifact{evidenceCount !== 1 ? "s" : ""} submitted
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-muted/15 overflow-hidden mb-2">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${Math.min(progressToNext, 100)}%`, backgroundColor: currentTier.color }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground/40">
              <span>{currentTier.name}</span>
              {nextTier ? (
                <span>{nextTier.min - evidenceCount} more for {nextTier.name}</span>
              ) : (
                <span>Maximum tier reached</span>
              )}
            </div>
            {/* Tier legend */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-muted/10">
              {VERIFICATION_TIERS.map((t, i) => (
                <div key={t.name} className={`flex items-center gap-1.5 ${i <= tierIndex ? "opacity-100" : "opacity-30"}`}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                  <span className="text-[9px] text-muted-foreground/60">{t.name}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Trust Strip */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground/30 uppercase tracking-wider">
            <span>AI + Human Review</span>
            <span className="text-muted-foreground/10">•</span>
            <span>Encrypted at Rest</span>
            <span className="text-muted-foreground/10">•</span>
            <span>Never Shared</span>
            <span className="text-muted-foreground/10">•</span>
            <span>HIPAA Compliant</span>
          </div>
          <p className="text-muted-foreground/25 text-xs">
            Accepted evidence increases your axis scores and verification tier. Rejected evidence is explained with feedback.
          </p>
        </motion.div>
      </main>

      {/* Footer */}
      <div className="relative z-10">
        <PublicFooter />
      </div>
    </div>
  );
}

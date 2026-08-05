// ============================================================
// MESSAGES — the members-only communications grid
// ============================================================
// Exclusive to connected members (mutual accept on /matches). Text + ephemeral
// attachments (images, PDFs/documents, voice notes, short videos). Attachment
// files are permanently wiped from our servers 72 hours after upload — stated
// in the composer, enforced by the server purge. Poll-based refresh (10s).

import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { PublicHeader, PublicFooter } from "@/components/PublicLayout";

const INK = "#141009";
const INK2 = "#1B1610";
const CREAM = "#F1EADB";
const CREAM2 = "#C4B89F";
const MUTED = "#867A66";
const LINE_C = "rgba(241,234,219,0.10)";
const CHAMPAGNE = "#E0C68C";
const JADE = "#9BC0B2";

const mono = { fontFamily: "'JetBrains Mono', monospace" } as const;
const serif = { fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 } as const;

const MAX_UI_BYTES = 30 * 1024 * 1024; // hard client-side ceiling (video cap)

function fmtTime(d: string | Date) {
  const t = new Date(d);
  return t.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function AttachmentView({ a }: { a: { name: string | null; type: string | null; url: string | null } }) {
  if (!a.url) {
    return <div style={{ ...mono, fontSize: "11px", color: MUTED, fontStyle: "italic" }}>[Attachment expired — files wipe after 72 hours]</div>;
  }
  if (a.type?.startsWith("image/")) {
    return <a href={a.url} target="_blank" rel="noreferrer"><img src={a.url} alt={a.name ?? "image"} style={{ maxWidth: "100%", maxHeight: "260px", borderRadius: "10px", display: "block" }} /></a>;
  }
  if (a.type?.startsWith("video/")) {
    return <video src={a.url} controls style={{ maxWidth: "100%", maxHeight: "280px", borderRadius: "10px", display: "block" }} />;
  }
  if (a.type?.startsWith("audio/")) {
    return <audio src={a.url} controls style={{ width: "100%" }} />;
  }
  return (
    <a href={a.url} target="_blank" rel="noreferrer" style={{ ...mono, fontSize: "12px", color: CHAMPAGNE, textDecoration: "underline" }}>
      📎 {a.name ?? "Download file"}
    </a>
  );
}

export default function Messages() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const [activeUserId, setActiveUserId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [pendingFile, setPendingFile] = useState<{ base64: string; name: string; type: string; size: number } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const threads = trpc.messaging.threads.useQuery(undefined, {
    enabled: !!user,
    refetchInterval: 15_000,
    retry: false,
  });
  const thread = trpc.messaging.thread.useQuery(
    { otherUserId: activeUserId ?? 0 },
    { enabled: !!user && !!activeUserId, refetchInterval: 10_000, retry: false },
  );
  const send = trpc.messaging.send.useMutation({
    onSuccess: () => {
      setDraft("");
      setPendingFile(null);
      utils.messaging.thread.invalidate();
      utils.messaging.threads.invalidate();
    },
    onError: (e) => toast.error(e.message || "Couldn't send."),
  });

  // Auto-select the first thread; auto-scroll on new messages.
  useEffect(() => {
    if (!activeUserId && threads.data && threads.data.length > 0) setActiveUserId(threads.data[0].userId);
  }, [threads.data, activeUserId]);
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [thread.data?.length]);

  const activeName = useMemo(
    () => threads.data?.find((t) => t.userId === activeUserId)?.name ?? "Member",
    [threads.data, activeUserId],
  );

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (f.size > MAX_UI_BYTES) {
      toast.error("Too large — images up to 10 MB, documents 25 MB, video 30 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const base64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
      setPendingFile({ base64, name: f.name, type: f.type || "application/octet-stream", size: f.size });
    };
    reader.readAsDataURL(f);
  };

  const submit = () => {
    if (!activeUserId || send.isPending) return;
    if (!draft.trim() && !pendingFile) return;
    send.mutate({
      toUserId: activeUserId,
      content: draft.trim() || undefined,
      attachment: pendingFile ? { base64: pendingFile.base64, name: pendingFile.name, type: pendingFile.type } : undefined,
    });
  };

  return (
    <div className="min-h-screen relative flex flex-col" style={{ background: INK }}>
      <PublicHeader />
      <div className="relative z-10 flex-1 w-full max-w-[1100px] mx-auto px-[clamp(16px,4vw,40px)] py-[clamp(24px,4vw,48px)]">
        <div style={{ ...mono, fontSize: "10px", letterSpacing: "0.26em", textTransform: "uppercase", color: CHAMPAGNE, marginBottom: "10px" }}>
          Members only · your private network
        </div>
        <h1 style={{ ...serif, fontSize: "clamp(26px,4.5vw,42px)", lineHeight: 1.04, color: CREAM, margin: "0 0 8px" }}>Messages</h1>
        <p style={{ color: CREAM2, fontSize: "13.5px", lineHeight: 1.6, maxWidth: "46em", marginBottom: "22px" }}>
          Talk only with members you&rsquo;ve mutually connected with. Share images, documents, voice notes, and short
          videos — <b style={{ color: CREAM }}>every shared file is permanently wiped from our servers 72 hours after
          upload</b>. We never open, read, or analyze your conversations. Save anything important locally.
        </p>

        {!loading && !user && (
          <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", padding: "24px", color: CREAM2 }}>
            <Link href="/login" style={{ color: CHAMPAGNE }}>Sign in</Link> to open your messages.
          </div>
        )}

        {user && threads.data && threads.data.length === 0 && (
          <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", padding: "24px", color: CREAM2 }}>
            No connections yet. Messaging opens when a connection is <b style={{ color: CREAM }}>mutual</b> — find your
            complementary matches and send a request.{" "}
            <Link href="/matches" style={{ color: CHAMPAGNE }}>See your matches →</Link>
          </div>
        )}

        {user && threads.data && threads.data.length > 0 && (
          <div className="grid gap-4" style={{ gridTemplateColumns: "minmax(200px,260px) 1fr", minHeight: "480px" }}>
            {/* Thread list */}
            <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", background: INK2, overflow: "hidden", alignSelf: "start" }}>
              {threads.data.map((t) => (
                <button key={t.userId} onClick={() => setActiveUserId(t.userId)}
                  className="w-full text-left"
                  style={{ display: "block", padding: "14px 16px", background: t.userId === activeUserId ? "rgba(224,198,140,0.07)" : "transparent", border: 0, borderBottom: `1px solid ${LINE_C}`, cursor: "pointer" }}>
                  <div className="flex items-center justify-between gap-2">
                    <span style={{ color: CREAM, fontSize: "14px", fontWeight: 600 }}>{t.name}</span>
                    {t.unread > 0 && (
                      <span style={{ ...mono, fontSize: "10px", background: CHAMPAGNE, color: INK, borderRadius: "999px", padding: "2px 7px", fontWeight: 700 }}>{t.unread}</span>
                    )}
                  </div>
                  {t.lastMessage && <div style={{ color: MUTED, fontSize: "12px", marginTop: "3px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.lastMessage}</div>}
                </button>
              ))}
            </div>

            {/* Active thread */}
            <div style={{ border: `1px solid ${LINE_C}`, borderRadius: "12px", background: INK2, display: "flex", flexDirection: "column", minHeight: "480px" }}>
              <div style={{ padding: "12px 18px", borderBottom: `1px solid ${LINE_C}`, ...serif, fontSize: "18px", color: CREAM }}>{activeName}</div>

              <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px", display: "flex", flexDirection: "column", gap: "10px" }}>
                {thread.data?.map((m) => (
                  <div key={m.id} style={{ alignSelf: m.mine ? "flex-end" : "flex-start", maxWidth: "78%" }}>
                    <div style={{
                      background: m.mine ? "rgba(224,198,140,0.12)" : "rgba(241,234,219,0.05)",
                      border: `1px solid ${m.mine ? "rgba(224,198,140,0.25)" : LINE_C}`,
                      borderRadius: m.mine ? "12px 12px 3px 12px" : "12px 12px 12px 3px",
                      padding: "10px 13px",
                    }}>
                      {m.attachment && <div style={{ marginBottom: m.content ? "8px" : 0 }}><AttachmentView a={m.attachment} /></div>}
                      {m.content && <div style={{ color: CREAM, fontSize: "14px", lineHeight: 1.55, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{m.content}</div>}
                    </div>
                    <div style={{ ...mono, fontSize: "9px", color: MUTED, marginTop: "3px", textAlign: m.mine ? "right" : "left" }}>
                      {fmtTime(m.createdAt)}{m.mine && m.readAt ? " · read" : ""}
                    </div>
                  </div>
                ))}
                {thread.data && thread.data.length === 0 && (
                  <div style={{ color: MUTED, fontSize: "13px", margin: "auto" }}>Say hello — this thread is private to the two of you.</div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Composer */}
              <div style={{ borderTop: `1px solid ${LINE_C}`, padding: "12px 14px" }}>
                {pendingFile && (
                  <div className="flex items-center justify-between gap-2" style={{ ...mono, fontSize: "11px", color: JADE, marginBottom: "8px" }}>
                    <span>📎 {pendingFile.name} ({(pendingFile.size / (1024 * 1024)).toFixed(1)} MB) — wipes in 72h</span>
                    <button onClick={() => setPendingFile(null)} style={{ background: "none", border: 0, color: MUTED, cursor: "pointer" }}>✕</button>
                  </div>
                )}
                <div className="flex gap-2 items-end">
                  {/* Photos — image/* input surfaces the native photo-library
                      permission prompt on iOS/Android the first time. */}
                  <button onClick={() => photoInput.current?.click()} title="Share a photo from your library"
                    style={{ ...mono, fontSize: "16px", background: "transparent", border: `1px solid ${LINE_C}`, borderRadius: "8px", color: CREAM2, padding: "10px 12px", cursor: "pointer", flex: "none" }}>
                    🖼
                  </button>
                  <input ref={photoInput} type="file" hidden accept="image/*"
                    onChange={(e) => { pickFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                  <button onClick={() => fileInput.current?.click()} title="Attach a file (PDF, document, voice note, short video)"
                    style={{ ...mono, fontSize: "16px", background: "transparent", border: `1px solid ${LINE_C}`, borderRadius: "8px", color: CREAM2, padding: "10px 12px", cursor: "pointer", flex: "none" }}>
                    📎
                  </button>
                  <input ref={fileInput} type="file" hidden
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx"
                    onChange={(e) => { pickFile(e.target.files?.[0] ?? null); e.target.value = ""; }} />
                  <textarea value={draft} onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }}
                    placeholder="Write a message…" rows={1}
                    style={{ flex: 1, resize: "none", background: "rgba(241,234,219,0.04)", border: `1px solid ${LINE_C}`, borderRadius: "8px", padding: "11px 13px", fontSize: "14px", color: CREAM, outline: "none", minHeight: "42px", maxHeight: "120px" }} />
                  <button onClick={submit} disabled={send.isPending || (!draft.trim() && !pendingFile)}
                    style={{ ...mono, fontSize: "11px", letterSpacing: "0.1em", textTransform: "uppercase", padding: "12px 18px", background: CHAMPAGNE, color: INK, border: 0, borderRadius: "8px", cursor: "pointer", fontWeight: 700, flex: "none", opacity: send.isPending ? 0.6 : 1 }}>
                    {send.isPending ? "…" : "Send"}
                  </button>
                </div>
                <div style={{ ...mono, fontSize: "9.5px", color: MUTED, marginTop: "7px" }}>
                  Images ≤10MB · documents ≤25MB · voice ≤5MB · video ≤30MB · up to 250MB &amp; 50 files per 48 hours ·
                  all files wiped after 72 hours · conversations never read by staff
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      <PublicFooter />
    </div>
  );
}

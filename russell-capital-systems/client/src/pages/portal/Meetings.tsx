// @ts-nocheck
import { NumberInput } from "@/components/NumberInput";
import { AppShell } from "@/components/AppShell";
import { ExportToSlides } from "@/components/ExportToSlides";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Calendar, Clock, MapPin, Phone, Plus, Video, Users, X,
  ChevronLeft, ChevronRight, Edit2, Trash2, CheckCircle, XCircle,
  Bell, Settings2, Sparkles, BarChart3,
} from "lucide-react";
import {
  PieChart, Pie, Cell, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip as RTooltip, ResponsiveContainer,
} from "recharts";

const MEETING_TYPE_ICONS: Record<string, typeof Video> = {
  VIDEO: Video,
  PHONE: Phone,
  IN_PERSON: MapPin,
  OTHER: Users,
};

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  COMPLETED: "bg-green-500/20 text-green-400 border-green-500/30",
  CANCELLED: "bg-red-500/20 text-red-400 border-red-500/30",
  NO_SHOW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Meetings() {
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"calendar" | "list">("calendar");
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const utils = trpc.useUtils();
  const { data: allMeetings, isLoading } = trpc.meetings.listAll.useQuery({ limit: 200 });
  const { data: clients } = trpc.clients.list.useQuery();

  const createMeeting = trpc.meetings.create.useMutation({
    onSuccess: () => { utils.meetings.listAll.invalidate(); utils.meetings.listUpcoming.invalidate(); setShowCreate(false); toast.success("Meeting scheduled"); },
    onError: (e) => toast.error(e.message),
  });
  const updateMeeting = trpc.meetings.update.useMutation({
    onSuccess: () => { utils.meetings.listAll.invalidate(); utils.meetings.listUpcoming.invalidate(); setEditingId(null); toast.success("Meeting updated"); },
    onError: (e) => toast.error(e.message),
  });
  const deleteMeeting = trpc.meetings.delete.useMutation({
    onSuccess: () => { utils.meetings.listAll.invalidate(); utils.meetings.listUpcoming.invalidate(); toast.success("Meeting deleted"); },
    onError: (e) => toast.error(e.message),
  });

  const meetingsByDate = useMemo(() => {
    const map: Record<string, typeof allMeetings> = {};
    allMeetings?.forEach((m) => {
      const key = new Date(m.scheduledAt).toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key]!.push(m);
    });
    return map;
  }, [allMeetings]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date().toISOString().split("T")[0];

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDay, daysInMonth]);

  const selectedMeetings = selectedDate ? (meetingsByDate[selectedDate] || []) : [];

  return (
    <AppShell>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Analytics Row */}
        {(allMeetings?.length ?? 0) > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="rc-card">
              <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <BarChart3 size={14} className="text-[#22c55e]" /> Meetings by Type
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={(() => {
                      const counts: Record<string, number> = {};
                      allMeetings?.forEach((m) => { counts[m.meetingType || "OTHER"] = (counts[m.meetingType || "OTHER"] || 0) + 1; });
                      return Object.entries(counts).map(([name, value]) => ({ name, value }));
                    })()}
                    cx="50%" cy="50%" innerRadius={45} outerRadius={70}
                    paddingAngle={3} dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {["#3b82f6", "#22c55e", "#f0c040", "#a78bfa"].map((c, i) => (
                      <Cell key={i} fill={c} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="rc-card">
              <div className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Calendar size={14} className="text-[#3b82f6]" /> Monthly Meeting Volume
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart
                  data={(() => {
                    const months: Record<string, number> = {};
                    allMeetings?.forEach((m) => {
                      const mo = new Date(m.scheduledAt).toLocaleDateString("en-US", { month: "short", year: "2-digit" });
                      months[mo] = (months[mo] || 0) + 1;
                    });
                    return Object.entries(months).slice(-8).map(([name, count]) => ({ name, count }));
                  })()}
                  margin={{ top: 5, right: 10, bottom: 5, left: -10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#12233e" />
                  <XAxis dataKey="name" tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#7a95b8", fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <RTooltip contentStyle={{ background: "#0b1628", border: "1px solid #12233e", borderRadius: 8, color: "#fff", fontSize: 12 }} />
                  <Bar dataKey="count" name="Meetings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Meetings</h1>
            <p className="text-sm text-[#7a95b8] mt-1">Schedule and track client meetings</p>
          </div>
          <div className="flex items-center gap-3">
            <ExportToSlides
              toolName="Meetings"
              getSections={() => {
                const upcoming = allMeetings?.filter((m) => m.status === "SCHEDULED") || [];
                return [
                  {
                    title: "Meetings Summary",
                    items: [
                      { label: "Total Meetings", value: String(allMeetings?.length || 0) },
                      { label: "Upcoming Meetings", value: String(upcoming.length) },
                    ]
                  }
                ];
              }}
            />
            <div className="flex bg-[#0a1628] border border-[#12233e] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("calendar")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "calendar" ? "bg-[#22c55e]/20 text-[#22c55e]" : "text-[#7a95b8] hover:text-white"}`}
              >
                Calendar
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${viewMode === "list" ? "bg-[#22c55e]/20 text-[#22c55e]" : "text-[#7a95b8] hover:text-white"}`}
              >
                List
              </button>
            </div>
            <button onClick={() => setShowCreate(true)} className="rc-btn rc-btn-primary text-sm flex items-center gap-2">
              <Plus size={14} /> Schedule Meeting
            </button>
          </div>
        </div>

        {viewMode === "calendar" ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Calendar Grid */}
            <div className="lg:col-span-2 rc-card p-4">
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="rc-btn rc-btn-ghost p-2">
                  <ChevronLeft size={16} />
                </button>
                <h2 className="text-lg font-semibold text-white">{MONTHS[month]} {year}</h2>
                <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="rc-btn rc-btn-ghost p-2">
                  <ChevronRight size={16} />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="text-center text-[10px] text-[#7a95b8] font-medium py-1">{d}</div>
                ))}
                {calendarDays.map((day, i) => {
                  if (day === null) return <div key={`e-${i}`} />;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                  const meetings = meetingsByDate[dateStr] || [];
                  const isToday = dateStr === today;
                  const isSelected = dateStr === selectedDate;
                  return (
                    <button
                      key={dateStr}
                      onClick={() => setSelectedDate(dateStr)}
                      className={`relative p-1 min-h-[60px] rounded-lg text-left transition-all ${
                        isSelected ? "bg-[#22c55e]/10 border border-[#22c55e]/30" :
                        isToday ? "bg-blue-500/10 border border-blue-500/30" :
                        "hover:bg-[#12233e]/50 border border-transparent"
                      }`}
                    >
                      <span className={`text-xs font-medium ${isToday ? "text-blue-400" : "text-[#7a95b8]"}`}>{day}</span>
                      {meetings.length > 0 && (
                        <div className="mt-0.5 space-y-0.5">
                          {meetings.slice(0, 2).map((m) => (
                            <div key={m.id} className="text-[9px] px-1 py-0.5 rounded bg-[#22c55e]/10 text-[#22c55e] truncate">
                              {m.title}
                            </div>
                          ))}
                          {meetings.length > 2 && (
                            <div className="text-[9px] text-[#7a95b8]">+{meetings.length - 2} more</div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Date Meetings */}
            <div className="rc-card p-4">
              <h3 className="text-sm font-semibold text-white mb-3">
                {selectedDate ? new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" }) : "Select a date"}
              </h3>
              {selectedDate && selectedMeetings.length === 0 && (
                <p className="text-xs text-[#7a95b8]">No meetings on this date.</p>
              )}
              <div className="space-y-2">
                {selectedMeetings.map((m) => {
                  const TypeIcon = MEETING_TYPE_ICONS[m.meetingType] || Users;
                  return (
                    <div key={m.id} className="p-3 rounded-lg bg-[#0a1628] border border-[#12233e]">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <TypeIcon size={14} className="text-[#22c55e]" />
                          <span className="text-sm font-medium text-white">{m.title}</span>
                        </div>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[m.status]}`}>{m.status}</span>
                      </div>
                      <div className="mt-1 text-xs text-[#7a95b8] flex items-center gap-2">
                        <Clock size={10} />
                        {new Date(m.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                        <span>({m.durationMin}m)</span>
                      </div>
                      {m.location && <div className="mt-1 text-xs text-[#7a95b8] flex items-center gap-2"><MapPin size={10} />{m.location}</div>}
                      <div className="mt-2 flex gap-1">
                        {m.status === "SCHEDULED" && (
                          <>
                            <button onClick={() => updateMeeting.mutate({ id: m.id, status: "COMPLETED" })} className="rc-btn rc-btn-ghost text-[10px] p-1 text-green-400"><CheckCircle size={12} /></button>
                            <button onClick={() => updateMeeting.mutate({ id: m.id, status: "CANCELLED" })} className="rc-btn rc-btn-ghost text-[10px] p-1 text-red-400"><XCircle size={12} /></button>
                          </>
                        )}
                        <button onClick={() => setEditingId(m.id)} className="rc-btn rc-btn-ghost text-[10px] p-1 text-[#7a95b8]"><Edit2 size={12} /></button>
                        <button onClick={() => { if (confirm("Delete this meeting?")) deleteMeeting.mutate({ id: m.id }); }} className="rc-btn rc-btn-ghost text-[10px] p-1 text-red-400"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* List View */
          <div className="rc-card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#12233e]">
                  <th className="text-left p-3 text-[#7a95b8] font-medium text-xs">Date & Time</th>
                  <th className="text-left p-3 text-[#7a95b8] font-medium text-xs">Title</th>
                  <th className="text-left p-3 text-[#7a95b8] font-medium text-xs">Type</th>
                  <th className="text-left p-3 text-[#7a95b8] font-medium text-xs">Duration</th>
                  <th className="text-left p-3 text-[#7a95b8] font-medium text-xs">Status</th>
                  <th className="text-left p-3 text-[#7a95b8] font-medium text-xs">Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="p-6 text-center text-[#7a95b8]">Loading...</td></tr>
                ) : !allMeetings?.length ? (
                  <tr><td colSpan={6} className="p-6 text-center text-[#7a95b8]">No meetings scheduled yet.</td></tr>
                ) : (
                  allMeetings.map((m) => {
                    const TypeIcon = MEETING_TYPE_ICONS[m.meetingType] || Users;
                    return (
                      <tr key={m.id} className="border-b border-[#12233e]/50 hover:bg-[#12233e]/20">
                        <td className="p-3 text-white text-xs">
                          {new Date(m.scheduledAt).toLocaleDateString()}<br />
                          <span className="text-[#7a95b8]">{new Date(m.scheduledAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>
                        </td>
                        <td className="p-3 text-white text-xs font-medium">{m.title}</td>
                        <td className="p-3"><TypeIcon size={14} className="text-[#22c55e]" /></td>
                        <td className="p-3 text-[#7a95b8] text-xs">{m.durationMin}m</td>
                        <td className="p-3"><span className={`text-[10px] px-1.5 py-0.5 rounded border ${STATUS_COLORS[m.status]}`}>{m.status}</span></td>
                        <td className="p-3">
                          <div className="flex gap-1">
                            <button onClick={() => setEditingId(m.id)} className="rc-btn rc-btn-ghost p-1"><Edit2 size={12} className="text-[#7a95b8]" /></button>
                            <button onClick={() => { if (confirm("Delete?")) deleteMeeting.mutate({ id: m.id }); }} className="rc-btn rc-btn-ghost p-1"><Trash2 size={12} className="text-red-400" /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Reminder Preferences */}
        <ReminderPrefsPanel />

        {/* Create Meeting Modal */}
        {showCreate && (
          <CreateMeetingModal
            clients={clients || []}
            onClose={() => setShowCreate(false)}
            onCreate={(data) => createMeeting.mutate(data)}
            isLoading={createMeeting.isPending}
          />
        )}

        {/* Edit Meeting Modal */}
        {editingId && (
          <EditMeetingModal
            meeting={allMeetings?.find((m) => m.id === editingId)}
            onClose={() => setEditingId(null)}
            onSave={(data) => updateMeeting.mutate({ id: editingId, ...data })}
            isLoading={updateMeeting.isPending}
          />
        )}
      </div>
    </AppShell>
  );
}

function CreateMeetingModal({ clients, onClose, onCreate, isLoading }: {
  clients: any[]; onClose: () => void;
  onCreate: (data: any) => void; isLoading: boolean;
}) {
  const [form, setForm] = useState({
    clientId: "", title: "", description: "", scheduledAt: "",
    durationMin: "60", location: "", meetingType: "VIDEO" as const, notes: "",
  });

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a1628] border border-[#12233e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#12233e]">
          <h2 className="text-lg font-semibold text-white">Schedule Meeting</h2>
          <button onClick={onClose} className="rc-btn rc-btn-ghost p-1"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-[#7a95b8] mb-1 block">Client *</label>
            <select value={form.clientId} onChange={(e) => setForm(f => ({ ...f, clientId: e.target.value }))} className="rc-input w-full text-sm">
              <option value="">Select client...</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[#7a95b8] mb-1 block">Title *</label>
            <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="rc-input w-full text-sm" placeholder="Quarterly review" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#7a95b8] mb-1 block">Date & Time *</label>
              <input type="datetime-local" value={form.scheduledAt} onChange={(e) => setForm(f => ({ ...f, scheduledAt: e.target.value }))} className="rc-input w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-[#7a95b8] mb-1 block">Duration (min)</label>
              <NumberInput value={form.durationMin} onChange={(v) => setForm(f => ({ ...f, durationMin: v }))}  className="rc-input w-full text-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#7a95b8] mb-1 block">Type</label>
              <select value={form.meetingType} onChange={(e) => setForm(f => ({ ...f, meetingType: e.target.value as any }))} className="rc-input w-full text-sm">
                <option value="VIDEO">Video Call</option>
                <option value="PHONE">Phone Call</option>
                <option value="IN_PERSON">In Person</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#7a95b8] mb-1 block">Location</label>
              <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} className="rc-input w-full text-sm" placeholder="Zoom / Office" />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#7a95b8] mb-1 block">Description</label>
            <textarea value={form.description} onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))} className="rc-input w-full text-sm" rows={2} placeholder="Meeting agenda..." />
          </div>
          <div>
            <label className="text-xs text-[#7a95b8] mb-1 block">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="rc-input w-full text-sm" rows={2} placeholder="Internal notes..." />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-[#12233e]">
          <button onClick={onClose} className="rc-btn rc-btn-ghost text-sm">Cancel</button>
          <button
            onClick={() => {
              if (!form.clientId || !form.title || !form.scheduledAt) { toast.error("Client, title, and date are required"); return; }
              onCreate({
                clientId: Number(form.clientId),
                title: form.title,
                description: form.description || undefined,
                scheduledAt: new Date(form.scheduledAt),
                durationMin: Number(form.durationMin) || 60,
                location: form.location || undefined,
                meetingType: form.meetingType,
                notes: form.notes || undefined,
              });
            }}
            disabled={isLoading}
            className="rc-btn rc-btn-primary text-sm"
          >
            {isLoading ? "Scheduling..." : "Schedule Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}

function EditMeetingModal({ meeting, onClose, onSave, isLoading }: {
  meeting: any; onClose: () => void;
  onSave: (data: any) => void; isLoading: boolean;
}) {
  const [form, setForm] = useState({
    title: meeting?.title || "",
    description: meeting?.description || "",
    durationMin: String(meeting?.durationMin || 60),
    location: meeting?.location || "",
    meetingType: meeting?.meetingType || "VIDEO",
    status: meeting?.status || "SCHEDULED",
    notes: meeting?.notes || "",
  });

  if (!meeting) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-[#0a1628] border border-[#12233e] rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[#12233e]">
          <h2 className="text-lg font-semibold text-white">Edit Meeting</h2>
          <button onClick={onClose} className="rc-btn rc-btn-ghost p-1"><X size={16} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-[#7a95b8] mb-1 block">Title</label>
            <input value={form.title} onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} className="rc-input w-full text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#7a95b8] mb-1 block">Duration (min)</label>
              <NumberInput value={form.durationMin} onChange={(v) => setForm(f => ({ ...f, durationMin: v }))}  className="rc-input w-full text-sm" />
            </div>
            <div>
              <label className="text-xs text-[#7a95b8] mb-1 block">Status</label>
              <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))} className="rc-input w-full text-sm">
                <option value="SCHEDULED">Scheduled</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="NO_SHOW">No Show</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#7a95b8] mb-1 block">Type</label>
              <select value={form.meetingType} onChange={(e) => setForm(f => ({ ...f, meetingType: e.target.value }))} className="rc-input w-full text-sm">
                <option value="VIDEO">Video Call</option>
                <option value="PHONE">Phone Call</option>
                <option value="IN_PERSON">In Person</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-[#7a95b8] mb-1 block">Location</label>
              <input value={form.location} onChange={(e) => setForm(f => ({ ...f, location: e.target.value }))} className="rc-input w-full text-sm" />
            </div>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs text-[#7a95b8]">Notes</label>
              <button
                type="button"
                onClick={() => {
                  const title = form.title || "Meeting";
                  const type = form.meetingType || "VIDEO";
                  const duration = form.durationMin || "60";
                  const summary = `Meeting Summary: ${title}\n` +
                    `Type: ${type} | Duration: ${duration} min\n` +
                    `Status: ${form.status}\n\n` +
                    `Key Discussion Points:\n- \n\nAction Items:\n- \n\nFollow-up Required:\n- `;
                  setForm(f => ({ ...f, notes: summary }));
                }}
                className="text-[10px] text-[#22c55e] hover:text-[#22c55e]/80 flex items-center gap-1"
              >
                <Sparkles size={10} /> Generate Template
              </button>
            </div>
            <textarea value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} className="rc-input w-full text-sm" rows={3} />
          </div>
        </div>
        <div className="flex justify-end gap-2 p-4 border-t border-[#12233e]">
          <button onClick={onClose} className="rc-btn rc-btn-ghost text-sm">Cancel</button>
          <button
            onClick={() => {
              onSave({
                title: form.title || undefined,
                durationMin: Number(form.durationMin) || undefined,
                location: form.location || undefined,
                meetingType: form.meetingType as any,
                status: form.status as any,
                notes: form.notes || undefined,
              });
            }}
            disabled={isLoading}
            className="rc-btn rc-btn-primary text-sm"
          >
            {isLoading ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

const LEAD_TIME_OPTIONS = [{ value: 15, label: "15 min" },
,
  { value: 30, label: "30 min" },
,
  { value: 60, label: "1 hour" },
,
  { value: 120, label: "2 hours" },
,
  { value: 720, label: "12 hours" }
];

const MEETING_TYPE_LABELS: Record<string, { label: string; icon: typeof Video }> = {
  VIDEO: { label: "Video Calls", icon: Video },
  PHONE: { label: "Phone Calls", icon: Phone },
  IN_PERSON: { label: "In-Person", icon: MapPin },
  OTHER: { label: "Other", icon: Users },
};

function ReminderPrefsPanel() {
  const [expanded, setExpanded] = useState(false);
  const prefsQuery = trpc.reminderPrefs.get.useQuery(undefined, { staleTime: 60_000 });
  const updatePrefs = trpc.reminderPrefs.update.useMutation({
    onSuccess: () => {
      prefsQuery.refetch();
      toast.success("Reminder preferences saved");
    },
    onError: (e) => toast.error(e.message),
  });

  const prefs = prefsQuery.data ?? [];

  const handleToggle = (meetingType: string, enabled: boolean) => {
    const updated = prefs.map((p) =>
      p.meetingType === meetingType ? { ...p, enabled } : p
    );
    updatePrefs.mutate({ prefs: updated.map((p) => ({ meetingType: p.meetingType as any, enabled: p.enabled, leadTimeMinutes: p.leadTimeMinutes })) });
  };

  const handleLeadTimeChange = (meetingType: string, leadTimeMinutes: number) => {
    const updated = prefs.map((p) =>
      p.meetingType === meetingType ? { ...p, leadTimeMinutes } : p
    );
    updatePrefs.mutate({ prefs: updated.map((p) => ({ meetingType: p.meetingType as any, enabled: p.enabled, leadTimeMinutes: p.leadTimeMinutes })) });
  };

  return (
    <div className="rc-card">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-2">
          <Bell size={16} className="text-[#f59e0b]" />
          <span className="text-white font-semibold">Reminder Preferences</span>
          <span className="text-xs text-[#7a95b8]">Configure when you receive meeting reminders</span>
        </div>
        <Settings2
          size={16}
          className={`text-[#7a95b8] transition-transform ${expanded ? "rotate-90" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-4 space-y-3">
          {prefsQuery.isLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-[#12233e] rounded-lg" />
              ))}
            </div>
          ) : (
            prefs.map((p) => {
              const meta = MEETING_TYPE_LABELS[p.meetingType] ?? MEETING_TYPE_LABELS.OTHER;
              const Icon = meta.icon;
              return (
                <div
                  key={p.meetingType}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    p.enabled
                      ? "bg-[#0f1e35] border-[#12233e]"
                      : "bg-[#0b1628] border-[#0f1e35] opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggle(p.meetingType, !p.enabled)}
                      className={`w-10 h-5 rounded-full transition-colors relative ${
                        p.enabled ? "bg-[#22c55e]" : "bg-[#1a2a42]"
                      }`}
                      title={p.enabled ? "Disable reminders" : "Enable reminders"}
                    >
                      <span
                        className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                          p.enabled ? "left-5" : "left-0.5"
                        }`}
                      />
                    </button>
                    <Icon size={14} className="text-[#7a95b8]" />
                    <span className="text-sm text-white font-medium">{meta.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#7a95b8]">Remind</span>
                    <select
                      value={p.leadTimeMinutes}
                      onChange={(e) => handleLeadTimeChange(p.meetingType, Number(e.target.value))}
                      disabled={!p.enabled}
                      className="rc-input text-xs py-1 px-2 w-28"
                    >
                      {LEAD_TIME_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label} before</option>
                      ))}
                    </select>
                  </div>
                </div>
              );
            })
          )}
          {updatePrefs.isPending && (
            <div className="flex items-center gap-2 text-xs text-[#7a95b8]">
              <span className="w-3 h-3 rounded-full border-2 border-[#7a95b8]/30 border-t-[#7a95b8] animate-spin" />
              Saving...
            </div>
          )}
        </div>
      )}
    </div>
  );
}

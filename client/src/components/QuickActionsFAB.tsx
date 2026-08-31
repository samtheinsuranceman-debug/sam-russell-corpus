import { useState } from "react";
import { Plus, UserPlus, Briefcase, Calculator, Calendar, X } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const ACTIONS = [
  { label: "New Client", icon: UserPlus, path: "/portal/clients", color: "#22c55e" },
  { label: "New Deal", icon: Briefcase, path: "/portal/pipeline", color: "#a78bfa" },
  { label: "Quick Quote", icon: Calculator, path: "/portal/quick-quote", color: "#f0c040" },
  { label: "Schedule Meeting", icon: Calendar, path: "/portal/meetings", color: "#3b82f6" },
];

export function QuickActionsFAB() {
  const [open, setOpen] = useState(false);
  const [, navigate] = useLocation();

  return (
    <div className="fixed bottom-20 right-6 z-40 md:bottom-8 flex flex-col-reverse items-end gap-2">
      {/* Action items */}
      {open && (
        <div className="flex flex-col-reverse gap-2 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.label}
                onClick={() => {
                  navigate(action.path);
                  setOpen(false);
                  toast.info(`Navigating to ${action.label}`);
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#0b1628] border border-[#1a3055] shadow-lg hover:border-[#22c55e]/40 transition-all group"
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: `${action.color}20`, border: `1px solid ${action.color}40` }}
                >
                  <Icon size={14} style={{ color: action.color }} />
                </div>
                <span className="text-sm text-white font-medium whitespace-nowrap">{action.label}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Main FAB button */}
      <button
        onClick={() => setOpen(!open)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 ${
          open
            ? "bg-[#0b1628] border border-[#1a3055] rotate-45"
            : "bg-[#22c55e] hover:bg-[#16a34a] border border-[#22c55e]"
        }`}
        aria-label={open ? "Close quick actions" : "Open quick actions"}
      >
        {open ? (
          <X size={22} className="text-white -rotate-45" />
        ) : (
          <Plus size={22} className="text-white" />
        )}
      </button>
    </div>
  );
}

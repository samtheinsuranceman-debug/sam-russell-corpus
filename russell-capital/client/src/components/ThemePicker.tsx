import { SLIDE_THEMES, type SlideTheme } from "@shared/slideThemes";
import { Check } from "lucide-react";

interface ThemePickerProps {
  value: string;
  onChange: (themeId: string) => void;
  compact?: boolean;
}

export default function ThemePicker({ value, onChange, compact }: ThemePickerProps) {
  return (
    <div className={compact ? "flex gap-2" : "grid grid-cols-2 md:grid-cols-4 gap-3"}>
      {SLIDE_THEMES.map((theme) => (
        <button
          key={theme.id}
          onClick={() => onChange(theme.id)}
          className={`relative rounded-lg border-2 transition-all text-left overflow-hidden ${
            value === theme.id
              ? "border-emerald-500 ring-2 ring-emerald-500/30"
              : "border-zinc-700 hover:border-zinc-500"
          } ${compact ? "p-2 min-w-[120px]" : "p-3"}`}
        >
          {/* Color preview bar */}
          <div
            className="h-2 rounded-full mb-2"
            style={{ background: theme.previewGradient }}
          />
          <p className={`font-semibold text-white ${compact ? "text-xs" : "text-sm"}`}>
            {theme.name}
          </p>
          {!compact && (
            <p className="text-xs text-zinc-400 mt-0.5">{theme.description}</p>
          )}
          {/* Color swatches */}
          <div className="flex gap-1 mt-1.5">
            {[theme.bgColor, theme.titleColor, theme.accentColor, theme.textColor].map((c, i) => (
              <div
                key={i}
                className="w-3 h-3 rounded-full border border-zinc-600"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          {/* Selected check */}
          {value === theme.id && (
            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

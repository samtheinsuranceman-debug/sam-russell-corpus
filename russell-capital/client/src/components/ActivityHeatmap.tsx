import { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

interface ActivityHeatmapProps {
  data: ActivityDay[];
  title?: string;
}

const INTENSITY_COLORS = [
  "#12233e",   // 0 activities
  "#0e4429",   // 1-2
  "#006d32",   // 3-5
  "#26a641",   // 6-9
  "#39d353",   // 10+
];

function getIntensity(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 9) return 3;
  return 4;
}

const DAYS = ["", "Mon", "", "Wed", "", "Fri", ""];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function ActivityHeatmap({ data, title = "Activity" }: ActivityHeatmapProps) {
  const { weeks, monthLabels } = useMemo(() => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 89); // 90 days
    // Align to Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());

    const dataMap = new Map<string, number>();
    data.forEach((d) => dataMap.set(d.date, d.count));

    const weeks: { date: Date; count: number }[][] = [];
    const monthLabels: { label: string; weekIndex: number }[] = [];
    let currentWeek: { date: Date; count: number }[] = [];
    let lastMonth = -1;

    const cursor = new Date(startDate);
    while (cursor <= today) {
      const dateStr = cursor.toISOString().split("T")[0];
      const count = dataMap.get(dateStr) ?? 0;

      if (cursor.getDay() === 0 && currentWeek.length > 0) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      if (cursor.getMonth() !== lastMonth) {
        monthLabels.push({ label: MONTHS[cursor.getMonth()], weekIndex: weeks.length });
        lastMonth = cursor.getMonth();
      }

      currentWeek.push({ date: new Date(cursor), count });
      cursor.setDate(cursor.getDate() + 1);
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return { weeks, monthLabels };
  }, [data]);

  const totalActivities = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rc-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <span className="text-xs text-[#7a95b8]">{totalActivities} activities in 90 days</span>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex flex-col gap-0.5 min-w-fit">
          {/* Month labels */}
          <div className="flex gap-0.5 ml-8 mb-1">
            {monthLabels.map((m, i) => (
              <div
                key={`${m.label}-${i}`}
                className="text-[10px] text-[#7a95b8]"
                style={{ marginLeft: i === 0 ? 0 : `${(m.weekIndex - (monthLabels[i - 1]?.weekIndex ?? 0)) * 14 - 20}px` }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {DAYS.map((d, i) => (
                <div key={i} className="h-[12px] text-[9px] text-[#7a95b8] leading-[12px]">
                  {d}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-0.5">
                {week.map((day, di) => (
                  <Tooltip key={`${wi}-${di}`}>
                    <TooltipTrigger asChild>
                      <div
                        className="w-[12px] h-[12px] rounded-[2px] cursor-pointer transition-all hover:ring-1 hover:ring-white/30"
                        style={{ backgroundColor: INTENSITY_COLORS[getIntensity(day.count)] }}
                      />
                    </TooltipTrigger>
                    <TooltipContent side="top" className="text-xs">
                      <strong>{day.count}</strong> {day.count === 1 ? "activity" : "activities"} on{" "}
                      {day.date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-2 ml-8">
            <span className="text-[10px] text-[#7a95b8]">Less</span>
            {INTENSITY_COLORS.map((color, i) => (
              <div
                key={i}
                className="w-[12px] h-[12px] rounded-[2px]"
                style={{ backgroundColor: color }}
              />
            ))}
            <span className="text-[10px] text-[#7a95b8]">More</span>
          </div>
        </div>
      </div>
    </div>
  );
}

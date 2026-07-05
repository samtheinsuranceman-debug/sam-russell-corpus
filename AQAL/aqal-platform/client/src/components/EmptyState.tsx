import { LucideIcon } from "lucide-react";
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from "@/components/ui/empty";

/**
 * Unified empty state component — consistent across all pages.
 * Uses the AQAL design language: glass card, subtle icon, muted text.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <Empty className="border-muted/20 bg-muted/5 backdrop-blur-sm py-12">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-primary/10 text-primary border border-primary/20">
          <Icon className="w-5 h-5" />
        </EmptyMedia>
        <EmptyTitle className="text-foreground/80">{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
      {action && <div className="mt-2">{action}</div>}
    </Empty>
  );
}

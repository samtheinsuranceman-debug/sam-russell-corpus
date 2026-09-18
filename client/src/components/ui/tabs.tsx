import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex h-auto min-h-10 w-fit items-center justify-center rounded-xl p-1.5 flex-wrap gap-1",
        "bg-[#0d1f3c] border-2 border-amber-500/30 shadow-md shadow-amber-500/5",
        className
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        // Base styles — larger font, padded, rounded
        "inline-flex h-auto min-h-[38px] flex-none items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold whitespace-normal text-center transition-all duration-200",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/50",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        // Inactive state — teal/cyan distinct color with border
        "border border-cyan-500/30 bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400/50 hover:text-cyan-200",
        // Active state — amber glow
        "data-[state=active]:bg-amber-500/20 data-[state=active]:border-amber-400/60 data-[state=active]:text-amber-300 data-[state=active]:shadow-md data-[state=active]:shadow-amber-500/20 data-[state=active]:ring-1 data-[state=active]:ring-amber-400/30",
        className
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

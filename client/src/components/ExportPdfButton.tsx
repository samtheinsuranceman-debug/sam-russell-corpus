import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Section {
  title: string;
  items: Array<{ label: string; value: string; color?: string }>;
}

interface ExportPdfButtonProps {
  pageTitle: string;
  clientName?: string;
  getSections: () => Section[];
  getBullets?: () => string[];
  notes?: string;
  className?: string;
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
}

export default function ExportPdfButton({
  pageTitle,
  clientName,
  getSections,
  getBullets,
  notes,
  className,
  variant = "outline",
  size = "sm",
}: ExportPdfButtonProps) {
  const exportMut = trpc.strategyExport.generate.useMutation({
    onSuccess: (data) => {
      window.open(data.url, "_blank");
      toast.success("PDF generated successfully", { description: data.fileName });
    },
    onError: (err) => {
      toast.error("Failed to generate PDF", { description: err.message });
    },
  });

  const handleExport = () => {
    const sections = getSections();
    if (!sections.length) {
      toast.error("No data to export. Run the calculator first.");
      return;
    }
    exportMut.mutate({
      pageTitle,
      clientName,
      sections,
      bullets: getBullets?.(),
      notes,
    });
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      disabled={exportMut.isPending}
      className={className}
    >
      {exportMut.isPending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1" />
      ) : (
        <Download className="h-4 w-4 mr-1" />
      )}
      Export PDF
    </Button>
  );
}

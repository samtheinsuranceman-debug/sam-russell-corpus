import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileCheck2, FolderLock, ReceiptText, ShieldCheck } from "lucide-react";
import { Link } from "wouter";

const destinations = [
  { href: "/portal/compliance-audit", title: "Compliance Audit", description: "Review persisted compliance activity and calculation evidence.", icon: ShieldCheck },
  { href: "/portal/audit-timeline", title: "Audit Timeline", description: "Open the chronological audit workflow for saved records.", icon: FileCheck2 },
  { href: "/portal/document-vault", title: "Document Vault", description: "Access the protected document workflow for authorized workspace files.", icon: FolderLock },
  { href: "/portal/billing", title: "Billing Status", description: "Review the current payment-integration status without synthetic invoices or payment claims.", icon: ReceiptText },
];

export default function LegalPaymentFolder() {
  return (
    <AppShell title="Legal Payment Folder" subtitle="Protected access to verified legal and payment workflows">
      <div className="mx-auto max-w-5xl space-y-6 p-6">
        <Card className="border-amber-400/20 bg-slate-950/60">
          <CardHeader><CardTitle>Verified records only</CardTitle><CardDescription>This route no longer displays generated disclosures, random compliance metrics, simulated signatures, or placeholder controls. Use the protected systems below.</CardDescription></CardHeader>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {destinations.map(({ href, title, description, icon: Icon }) => (
            <Card key={href} className="border-slate-700/60 bg-slate-950/50"><CardHeader><Icon className="h-6 w-6 text-amber-300" /><CardTitle>{title}</CardTitle></CardHeader><CardContent><p className="mb-5 text-sm text-slate-400">{description}</p><Link href={href}><Button variant="outline">Open {title} <ArrowRight className="ml-2 h-4 w-4" /></Button></Link></CardContent></Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}

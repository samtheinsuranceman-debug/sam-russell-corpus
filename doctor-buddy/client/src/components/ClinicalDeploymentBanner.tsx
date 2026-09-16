import { ShieldCheck, Stethoscope } from "lucide-react";
import { CLINICAL_TOOLS_ENABLED, CLINICAL_COVERED_ENTITY_NAME, CLINICAL_NPP_URL } from "@/lib/releasePolicy";

export default function ClinicalDeploymentBanner() {
  if (!CLINICAL_TOOLS_ENABLED) return null;
  return (
    <div className="fixed top-16 left-0 right-0 z-40 border-b border-cyan-400/20 bg-cyan-950/90 backdrop-blur-md">
      <div className="container min-h-9 py-1.5 flex flex-wrap items-center justify-between gap-2 text-[11px] md:text-xs">
        <div className="flex items-center gap-2 text-cyan-100">
          <Stethoscope className="w-3.5 h-3.5 text-cyan-300" />
          <span><strong>Clinical Edition</strong> · decision support for authorized care workflows · human clinician review required</span>
        </div>
        <div className="flex items-center gap-2 text-cyan-200/80">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{CLINICAL_COVERED_ENTITY_NAME || "Configured clinical organization"}</span>
          {CLINICAL_NPP_URL && <a className="underline underline-offset-2 hover:text-white" href={CLINICAL_NPP_URL} target="_blank" rel="noreferrer">Privacy Notice</a>}
        </div>
      </div>
    </div>
  );
}

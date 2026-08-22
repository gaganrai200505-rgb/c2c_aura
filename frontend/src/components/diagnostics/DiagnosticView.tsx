// components/diagnostics/DiagnosticView.tsx — 3-Pillar Diagnostic Report Assembly

import type { MediaDNAReport } from "@/types/truthdna";
import { DiagnosticSummary } from "./DiagnosticSummary";
import { EvidenceMatrix } from "./EvidenceMatrix";
import { ConfidenceBreakdown } from "./ConfidenceBreakdown";
import { UncertaintyReport } from "./UncertaintyReport";
import { ForensicRationale } from "./ForensicRationale";
import { ShareableCard } from "./ShareableCard";

interface DiagnosticViewProps {
  report: MediaDNAReport;
  fileName?: string;
  onReset: () => void;
}

export function DiagnosticView({ report, fileName, onReset }: DiagnosticViewProps) {
  return (
    <div className="w-full max-w-4xl mx-auto py-8 space-y-6">
      {/* Overview Banner */}
      <DiagnosticSummary report={report} fileName={fileName} />

      {/* Pillar 1: Evidence Matrix */}
      <EvidenceMatrix signals={report.forensic_evidence} />

      {/* Pillar 2: Confidence Calibration */}
      <ConfidenceBreakdown breakdown={report.confidence_breakdown} />

      {/* Pillar 3: Explicit Uncertainties */}
      <UncertaintyReport uncertainties={report.explicit_uncertainties} />

      {/* AI Chain of Thought Rationale */}
      <ForensicRationale rationale={report.weighting_rationale} />

      {/* Shareable Context Card & Action */}
      <ShareableCard cardText={report.shareable_context_card} onReset={onReset} />
    </div>
  );
}

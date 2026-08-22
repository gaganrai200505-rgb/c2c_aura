// components/diagnostics/DiagnosticSummary.tsx — Executive Forensic Overview Banner

import { useState } from "react";
import { Fingerprint, GitBranch, Copy, Check } from "lucide-react";
import type { MediaDNAReport } from "@/types/truthdna";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface DiagnosticSummaryProps {
  report: MediaDNAReport;
  fileName?: string;
}

export function DiagnosticSummary({ report, fileName }: DiagnosticSummaryProps) {
  const [copiedHash, setCopiedHash] = useState(false);

  const alteredCount = report.forensic_evidence.filter(
    (s) => s.status === "Altered"
  ).length;
  const suspiciousCount = report.forensic_evidence.filter(
    (s) => s.status === "Suspicious"
  ).length;
  const cleanCount = report.forensic_evidence.filter(
    (s) => s.status === "Clean"
  ).length;

  const phash = report.digital_genome?.visual_phash;

  const handleCopyHash = async () => {
    if (!phash) return;
    try {
      await navigator.clipboard.writeText(phash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // fallback
    }
  };

  return (
    <Card variant="elevated" className="w-full">
      <div className="p-6 sm:p-8">
        {/* Top title and status strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/[0.08]">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <h2 className="text-xl font-bold text-white tracking-tight">
                Forensic Diagnostic Report
              </h2>
              {fileName && (
                <span className="text-xs font-mono text-slate-300 bg-slate-900/90 px-2.5 py-1 rounded-md border border-slate-700">
                  {fileName}
                </span>
              )}
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              Evaluated against multi-modal error levels, acoustic harmonics, and vector provenance.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <Badge status="System" label="Non-Binary Protocol" size="md" />
          </div>
        </div>

        {/* 4-Column Metric Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
          {/* Signal Breakdown */}
          <div className="space-y-2 p-4 rounded-xl bg-black/20 border border-white/[0.05]">
            <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              Forensic Signals
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-bold text-white">
                {report.forensic_evidence.length}
              </span>
              <span className="text-xs text-slate-400 font-mono">dimensions</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {alteredCount > 0 && (
                <Badge status="Altered" label={`${alteredCount} Altered`} size="sm" />
              )}
              {suspiciousCount > 0 && (
                <Badge status="Suspicious" label={`${suspiciousCount} Suspicious`} size="sm" />
              )}
              {cleanCount > 0 && (
                <Badge status="Clean" label={`${cleanCount} Clean`} size="sm" />
              )}
            </div>
          </div>

          {/* Lineage Status */}
          <div className="space-y-2 p-4 rounded-xl bg-black/20 border border-white/[0.05]">
            <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
              Provenance Status
            </span>
            <div className="flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-indigo-400" />
              <span className="text-sm font-mono font-semibold text-white">
                {report.lineage_match_found ? "Lineage Matched" : "No Prior Record"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              {report.lineage_match_found
                ? "Correlated with vector archive"
                : "Unseen / novel source"}
            </p>
          </div>

          {/* Genome pHash */}
          <div className="space-y-2 p-4 rounded-xl bg-black/20 border border-white/[0.05] sm:col-span-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                Visual pHash Fingerprint
              </span>
              {phash && (
                <button
                  type="button"
                  onClick={handleCopyHash}
                  className="inline-flex items-center gap-1 text-[10px] font-mono text-indigo-400 hover:text-indigo-300"
                >
                  {copiedHash ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-sky-400 shrink-0" />
              <code className="text-xs font-mono text-indigo-200 bg-indigo-950/40 px-3 py-1.5 rounded-lg border border-indigo-800/40 truncate select-all flex-1">
                {phash || "pHash extraction uninformative"}
              </code>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Perceptual invariant hash for reverse search & deduplication
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
}

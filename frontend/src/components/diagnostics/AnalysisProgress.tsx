// components/diagnostics/AnalysisProgress.tsx — Live Forensic Pipeline Telemetry

import { FileText, Loader2, CheckCircle2, Shield, Database, Cpu, Zap } from "lucide-react";
import { ANALYSIS_STEPS } from "@/lib/constants";
import { formatBytes } from "@/lib/utils";
import { Card } from "@/components/ui/Card";

interface AnalysisProgressProps {
  file: File | null;
  currentStepIndex: number;
}

export function AnalysisProgress({ file, currentStepIndex }: AnalysisProgressProps) {
  const stepIcons = [Shield, Cpu, Database, Zap];

  return (
    <div className="w-full max-w-2xl mx-auto py-8 flex flex-col items-center">
      {/* File Ingestion Header */}
      {file && (
        <Card variant="elevated" className="w-full p-4 mb-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-700/50 flex items-center justify-center shrink-0 text-indigo-300">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-mono font-semibold text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs font-mono text-slate-400">
                  {formatBytes(file.size)} · {file.type || "binary/octet-stream"}
                </p>
              </div>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-700/40 px-2.5 py-1 rounded-md shrink-0">
              Ingested
            </span>
          </div>
        </Card>
      )}

      {/* Main Status */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">
          Sequencing Media DNA
        </h2>
        <p className="text-xs sm:text-sm text-slate-400">
          Extracting compression artifacts, computing perceptual fingerprints, and querying vector ledger...
        </p>
      </div>

      {/* Pipeline Steps Card */}
      <Card variant="elevated" className="w-full p-6 sm:p-8">
        <div className="space-y-6">
          {ANALYSIS_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const StepIcon = stepIcons[idx] || Cpu;

            return (
              <div
                key={step.id}
                className={`flex items-start gap-4 p-3.5 rounded-lg transition-colors ${
                  isCurrent
                    ? "bg-indigo-950/30 border border-indigo-800/40"
                    : isCompleted
                    ? "bg-black/20"
                    : "opacity-40"
                }`}
              >
                {/* Icon indicator */}
                <div className="mt-0.5 shrink-0">
                  {isCompleted ? (
                    <div className="w-6 h-6 rounded-md bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                  ) : isCurrent ? (
                    <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/50">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded-md bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                      <StepIcon className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>

                {/* Step detail */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p
                      className={`text-xs sm:text-sm font-mono font-semibold ${
                        isCurrent
                          ? "text-indigo-200"
                          : isCompleted
                          ? "text-slate-200"
                          : "text-slate-500"
                      }`}
                    >
                      {step.label}
                    </p>
                    {isCurrent && (
                      <span className="text-[11px] font-mono text-indigo-400 animate-pulse">
                        Active...
                      </span>
                    )}
                    {isCompleted && (
                      <span className="text-[11px] font-mono text-emerald-400">
                        Complete
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-xs mt-1 leading-normal ${
                      isCurrent
                        ? "text-slate-300"
                        : isCompleted
                        ? "text-slate-400"
                        : "text-slate-600"
                    }`}
                  >
                    {step.detail}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

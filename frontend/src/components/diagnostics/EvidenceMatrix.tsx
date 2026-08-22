// components/diagnostics/EvidenceMatrix.tsx — Pillar 1: Observed Forensic Signals

import { useState } from "react";
import { Shield, Clock, ExternalLink } from "lucide-react";
import type { ForensicSignal, SignalStatus } from "@/types/truthdna";
import { Badge } from "@/components/ui/Badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface EvidenceMatrixProps {
  signals: ForensicSignal[];
}

export function EvidenceMatrix({ signals }: EvidenceMatrixProps) {
  const [filter, setFilter] = useState<"ALL" | SignalStatus>("ALL");

  const filteredSignals =
    filter === "ALL"
      ? signals
      : signals.filter((s) => s.status === filter);

  return (
    <Card variant="elevated" className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-emerald-950/60 border border-emerald-700/60 flex items-center justify-center text-emerald-400">
            <Shield className="w-3.5 h-3.5" />
          </div>
          <CardTitle>Pillar 1: Forensic Evidence Matrix</CardTitle>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5">
          {(["ALL", "Altered", "Suspicious", "Clean"] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                filter === tab
                  ? "bg-slate-800 text-white font-semibold border border-slate-600"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y divide-white/[0.06]">
          {filteredSignals.length === 0 ? (
            <div className="p-8 text-center text-xs font-mono text-slate-500">
              No signals match the &quot;{filter}&quot; filter.
            </div>
          ) : (
            filteredSignals.map((signal, index) => (
              <div
                key={index}
                className="p-5 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col gap-2.5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-slate-200 font-mono tracking-tight">
                      {signal.dimension}
                    </h4>
                  </div>
                  <Badge status={signal.status} size="md" />
                </div>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {signal.finding}
                </p>

                {/* Metadata row: Timestamps & Sources */}
                {(signal.media_timestamp || signal.source_url) && (
                  <div className="flex flex-wrap items-center gap-3 pt-2 text-xs font-mono text-slate-400">
                    {signal.media_timestamp && (
                      <span className="inline-flex items-center gap-1.5 text-indigo-300 bg-indigo-950/40 px-2.5 py-1 rounded-md border border-indigo-800/40">
                        <Clock className="w-3.5 h-3.5 text-indigo-400" />
                        Timestamp: {signal.media_timestamp}
                      </span>
                    )}

                    {signal.source_url && (
                      <a
                        href={signal.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sky-400 hover:text-sky-300 hover:underline max-w-md truncate bg-sky-950/30 px-2.5 py-1 rounded-md border border-sky-800/40"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
                        <span className="truncate">{signal.source_url}</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

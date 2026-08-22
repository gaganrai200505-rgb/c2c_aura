// components/diagnostics/UncertaintyReport.tsx — Pillar 3: Explicit Uncertainties & Blind Spots

import { AlertTriangle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface UncertaintyReportProps {
  uncertainties: string[];
}

export function UncertaintyReport({ uncertainties }: UncertaintyReportProps) {
  return (
    <Card variant="elevated" className="w-full border-amber-500/20">
      <CardHeader className="bg-amber-950/20 border-amber-900/30">
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-amber-950/60 border border-amber-700/60 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-3.5 h-3.5" />
          </div>
          <CardTitle className="text-amber-300">
            Pillar 3: Explicit Uncertainties & Blind Spots
          </CardTitle>
        </div>
        <span className="text-xs font-mono text-amber-400/80">
          {uncertainties.length} limit{uncertainties.length !== 1 ? "s" : ""} declared
        </span>
      </CardHeader>

      <CardContent className="p-6">
        <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
          TruthDNA mandates transparent disclosure of missing evidence, unresolved compression artifacts, and unindexed provenance vectors:
        </p>

        <div className="grid grid-cols-1 gap-3">
          {uncertainties.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start gap-3.5 p-4 rounded-xl bg-amber-950/10 border border-amber-900/30 hover:border-amber-800/50 transition-colors"
            >
              <span className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 shadow-xs shadow-amber-400/50" />
              <p className="text-xs sm:text-sm text-amber-200/90 font-mono leading-relaxed">
                {item}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

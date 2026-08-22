// components/diagnostics/ConfidenceBreakdown.tsx — Pillar 2: Confidence Calibration

import { Activity } from "lucide-react";
import { MetricGauge } from "@/components/ui/MetricGauge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card";

interface ConfidenceBreakdownProps {
  breakdown: Record<string, number>;
}

export function ConfidenceBreakdown({ breakdown }: ConfidenceBreakdownProps) {
  const entries = Object.entries(breakdown);

  return (
    <Card variant="elevated" className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-sky-950/60 border border-sky-700/60 flex items-center justify-center text-sky-400">
            <Activity className="w-3.5 h-3.5" />
          </div>
          <CardTitle>Pillar 2: Confidence Calibration</CardTitle>
        </div>
        <span className="text-xs font-mono text-slate-400">
          {entries.length} dimensional score{entries.length !== 1 ? "s" : ""}
        </span>
      </CardHeader>

      <CardContent>
        {/* Metric Gauges Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6">
          {entries.map(([key, val]) => (
            <MetricGauge
              key={key}
              label={key}
              value={val}
              variant="dial"
            />
          ))}
        </div>

        {/* Detailed Horizontal Breakdown */}
        <div className="pt-6 border-t border-white/[0.06] grid grid-cols-1 sm:grid-cols-2 gap-4">
          {entries.map(([key, val]) => (
            <MetricGauge
              key={`bar-${key}`}
              label={key}
              value={val}
              variant="bar"
            />
          ))}
        </div>

        {/* Diagnostic Framing Note */}
        <div className="mt-6 p-3.5 rounded-lg bg-black/20 border border-white/[0.04] text-center">
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Multi-dimensional probabilities represent vector confidence margins, not a reductionist binary label.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

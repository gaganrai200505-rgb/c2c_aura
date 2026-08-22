// components/ui/MetricGauge.tsx — High-Precision Calibrated Confidence Gauges

import { cn, formatMetricLabel } from "@/lib/utils";

interface MetricGaugeProps {
  label: string;
  value: number; // 0.0 to 1.0
  variant?: "dial" | "bar";
  className?: string;
}

export function MetricGauge({
  label,
  value,
  variant = "dial",
  className,
}: MetricGaugeProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const percentage = Math.round(clamped * 100);

  // Refined calibration styling
  const getStatusColor = (val: number) => {
    if (val >= 0.7)
      return {
        stroke: "#10b981",
        text: "text-emerald-400",
        badgeBg: "bg-emerald-950/40 text-emerald-300 border-emerald-800/40",
        label: "High Confidence",
      };
    if (val >= 0.4)
      return {
        stroke: "#f59e0b",
        text: "text-amber-400",
        badgeBg: "bg-amber-950/40 text-amber-300 border-amber-800/40",
        label: "Moderate Calibration",
      };
    return {
      stroke: "#f43f5e",
      text: "text-rose-400",
      badgeBg: "bg-rose-950/40 text-rose-300 border-rose-800/40",
      label: "Ambiguous / Low",
    };
  };

  const status = getStatusColor(clamped);
  const formattedLabel = formatMetricLabel(label);

  if (variant === "bar") {
    return (
      <div className={cn("flex flex-col gap-2 p-3.5 rounded-xl bg-black/20 border border-white/[0.05]", className)}>
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-200 font-semibold">{formattedLabel}</span>
          <span className={cn("font-bold text-sm", status.text)}>
            {percentage}%
          </span>
        </div>
        <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${percentage}%`,
              backgroundColor: status.stroke,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
          <span>Score: {clamped.toFixed(3)}</span>
          <span className={cn("px-1.5 py-0.5 rounded text-[10px] border", status.badgeBg)}>
            {status.label}
          </span>
        </div>
      </div>
    );
  }

  // Precision Dial (SVG circle gauge)
  const radius = 32;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - clamped * circumference;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-5 rounded-xl bg-black/30 border border-white/[0.06] hover:border-white/[0.12] transition-colors",
        className
      )}
    >
      <div className="relative w-20 h-20 flex items-center justify-center mb-3">
        <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
          {/* Background track */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            strokeWidth={strokeWidth}
            className="stroke-slate-800/80 fill-none"
          />
          {/* Calibrated value arc */}
          <circle
            cx="40"
            cy="40"
            r={radius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{
              stroke: status.stroke,
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
            className="fill-none"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={cn("text-base font-mono font-bold tracking-tight", status.text)}>
            {percentage}%
          </span>
        </div>
      </div>

      <span className="text-xs text-center font-semibold text-slate-200 line-clamp-1 max-w-[130px]">
        {formattedLabel}
      </span>
      <span className="text-[11px] text-slate-500 font-mono mt-1">
        calibrated: {clamped.toFixed(2)}
      </span>
    </div>
  );
}

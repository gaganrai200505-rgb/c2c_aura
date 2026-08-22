// components/ui/Badge.tsx — Professional Status Badges

import { cn } from "@/lib/utils";
import type { SignalStatus } from "@/types/truthdna";

interface BadgeProps {
  status?: SignalStatus | "Lineage" | "Neutral" | "System" | "Verified";
  label?: string;
  size?: "sm" | "md";
  className?: string;
  dot?: boolean;
}

export function Badge({
  status = "Neutral",
  label,
  size = "sm",
  className,
  dot = true,
}: BadgeProps) {
  const displayLabel = label || status;

  const statusStyles: Record<
    string,
    { bg: string; text: string; border: string; dotColor: string }
  > = {
    Clean: {
      bg: "bg-emerald-950/40",
      text: "text-emerald-400",
      border: "border-emerald-700/50",
      dotColor: "bg-emerald-400",
    },
    Suspicious: {
      bg: "bg-amber-950/40",
      text: "text-amber-400",
      border: "border-amber-700/50",
      dotColor: "bg-amber-400",
    },
    Altered: {
      bg: "bg-rose-950/40",
      text: "text-rose-400",
      border: "border-rose-700/50",
      dotColor: "bg-rose-400",
    },
    Lineage: {
      bg: "bg-indigo-950/40",
      text: "text-indigo-300",
      border: "border-indigo-700/50",
      dotColor: "bg-indigo-400",
    },
    Verified: {
      bg: "bg-sky-950/40",
      text: "text-sky-300",
      border: "border-sky-700/50",
      dotColor: "bg-sky-400",
    },
    Neutral: {
      bg: "bg-slate-900/60",
      text: "text-slate-300",
      border: "border-slate-800",
      dotColor: "bg-slate-400",
    },
    System: {
      bg: "bg-slate-900",
      text: "text-slate-200",
      border: "border-slate-700",
      dotColor: "bg-slate-300",
    },
  };

  const current = statusStyles[status] || statusStyles.Neutral;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] font-medium tracking-wide font-mono",
    md: "px-2.5 py-1 text-xs font-medium tracking-wide font-mono",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border shadow-xs transition-colors",
        current.bg,
        current.text,
        current.border,
        sizeClasses[size],
        className
      )}
    >
      {dot && (
        <span
          className={cn("w-1.5 h-1.5 rounded-full shrink-0", current.dotColor)}
        />
      )}
      <span>{displayLabel}</span>
    </span>
  );
}

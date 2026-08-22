// components/ui/Card.tsx — Clean Refined Surface Panel

import React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "flat" | "bordered";
}

export function Card({
  className,
  variant = "default",
  children,
  ...props
}: CardProps) {
  const variantStyles = {
    default: "card-refined rounded-xl transition-colors duration-150",
    elevated: "card-refined rounded-xl shadow-lg shadow-black/40 transition-colors duration-150",
    flat: "bg-[#0b1329]/60 border border-slate-800/80 rounded-xl",
    bordered: "bg-[#0f172a] border border-slate-800 rounded-xl",
  };

  return (
    <div className={cn(variantStyles[variant], className)} {...props}>
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-6 py-4 border-b border-slate-800/80",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-2",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardDescription({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-slate-400 mt-1 leading-normal", className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("p-6", className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex items-center px-6 py-3.5 border-t border-slate-800/80 bg-slate-950/40 rounded-b-xl",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

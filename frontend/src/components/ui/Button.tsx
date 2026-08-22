// components/ui/Button.tsx — Clean Tactile Button Primitive

import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger" | "accent";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      icon,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-colors duration-150 select-none rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none active:scale-[0.98]";

    const variantStyles = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-500 shadow-sm border border-blue-500/30 font-semibold",
      accent:
        "bg-white text-slate-950 hover:bg-slate-100 shadow-sm border border-slate-200 font-semibold",
      secondary:
        "bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white border border-slate-700 shadow-xs",
      outline:
        "bg-transparent text-slate-300 hover:bg-slate-800/80 border border-slate-700 hover:border-slate-600 hover:text-white",
      ghost:
        "bg-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 border border-transparent",
      danger:
        "bg-rose-950/60 text-rose-300 hover:bg-rose-900/80 border border-rose-800/60 hover:border-rose-700",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs gap-1.5",
      md: "h-9 px-4 text-xs tracking-wide gap-2",
      lg: "h-11 px-6 text-sm tracking-wide gap-2.5",
    };

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

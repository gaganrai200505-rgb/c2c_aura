// components/layout/Container.tsx — Clean responsive layout container

import React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

export function Container({
  className,
  size = "lg",
  children,
  ...props
}: ContainerProps) {
  const maxSizes = {
    sm: "max-w-2xl",
    md: "max-w-3xl",
    lg: "max-w-5xl",
    xl: "max-w-6xl",
    full: "max-w-full",
  };

  return (
    <div
      className={cn("w-full mx-auto px-4 sm:px-6 lg:px-8", maxSizes[size], className)}
      {...props}
    >
      {children}
    </div>
  );
}

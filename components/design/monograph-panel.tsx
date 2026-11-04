import type React from "react";

import { cn } from "@/lib/utils";

export function MonographPanel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div {...props} className={cn("monograph-panel", className)}>
      {children}
    </div>
  );
}

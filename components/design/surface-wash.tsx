import type React from "react";

import { cn } from "@/lib/utils";

export function SurfaceWash({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      aria-hidden="true"
      className={cn("surface-wash", className)}
    />
  );
}

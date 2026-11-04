import type React from "react";

import type { Surface } from "@/lib/design/surfaces";
import { cn } from "@/lib/utils";

export function SunlitField({
  surface,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  surface?: Surface;
}) {
  return (
    <div
      {...props}
      data-surface={surface}
      className={cn("sunlit-field", className)}
    >
      {children}
    </div>
  );
}

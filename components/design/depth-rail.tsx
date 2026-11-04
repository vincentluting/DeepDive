import type React from "react";

import { cn } from "@/lib/utils";

type DepthRailStyle = React.CSSProperties & {
  "--depth-rail-value"?: string;
};

export function DepthRail({
  value = 0,
  orientation = "horizontal",
  className,
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: number;
  orientation?: "horizontal" | "vertical";
}) {
  const clampedValue = Math.min(100, Math.max(0, value)) / 100;
  const railStyle: DepthRailStyle = {
    ...style,
    "--depth-rail-value": clampedValue.toString(),
  };

  return (
    <div
      {...props}
      aria-hidden={props["aria-label"] ? undefined : true}
      className={cn("depth-rail", className)}
      data-orientation={orientation}
      style={railStyle}
    />
  );
}

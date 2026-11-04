"use client";

import type { ComponentType } from "react";
import { AlertCircle, Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoadingSkeleton({ height = "h-96" }: { height?: string }) {
  return <div className={`animate-pulse ${height} bg-muted/30 rounded-lg`} />;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  hint,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <Icon className="w-8 h-8 text-muted-foreground/40 mb-3" />
      <p className="text-sm text-muted-foreground">{title}</p>
      {hint && <p className="text-xs text-muted-foreground/60 mt-1">{hint}</p>}
    </div>
  );
}

export function ErrorState({
  message,
  retryLabel,
  onRetry,
}: {
  message: string;
  retryLabel: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center rounded-lg border border-destructive/30 bg-destructive/5">
      <AlertCircle className="w-6 h-6 text-destructive mb-2" />
      <p className="text-sm text-foreground/80 max-w-md px-4">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

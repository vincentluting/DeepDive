import type { ReactNode } from "react";

/**
 * Standard admin page header: title + optional description + action slot.
 * Server-component friendly (no hooks) — pass localized strings in.
 */
export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="dd-admin-page-header flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between mb-6 min-w-0">
      <div className="min-w-0">
        <p className="dd-admin-page-kicker" aria-hidden="true">
          01 / {title}
        </p>
        <h1 className="dd-admin-page-title text-2xl font-bold text-foreground truncate">
          {title}
        </h1>
        {description && (
          <p className="dd-admin-page-description text-sm text-muted-foreground mt-1">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="dd-admin-page-actions flex items-center gap-2 shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}

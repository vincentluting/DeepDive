"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SectionNavItem {
  href: string;
  label: string;
}

/**
 * Lightweight second-level link tabs (e.g. Research → Progress /
 * Analytics / Data Quality / Export). Each tab is a real URL.
 */
export function SectionNav({ items }: { items: SectionNavItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="scrollbar-none flex max-w-full items-center gap-1 overflow-x-auto rounded-lg bg-muted/50 p-1">
      {items.map((item) => {
        // Exact match so /admin/research doesn't stay active on sub-pages
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex min-h-9 shrink-0 items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors select-none ${
              active
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

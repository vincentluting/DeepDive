"use client";

import Link from "next/link";
import { ArrowRight, type LucideIcon } from "lucide-react";

export function CtaLink({
  href,
  children,
  variant = "primary",
  leadingIcon: LeadingIcon,
  showTrailing = true,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  leadingIcon?: LucideIcon;
  showTrailing?: boolean;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      className={
        variant === "primary" ? "dd-landing-cta" : "dd-landing-secondary"
      }
      onClick={onClick}
    >
      {LeadingIcon && <LeadingIcon className="size-4" aria-hidden="true" />}
      <span>{children}</span>
      {showTrailing && <ArrowRight className="size-4" aria-hidden="true" />}
    </Link>
  );
}

export function LandingSeal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={`dd-showcase-seal ${className ?? ""}`}>{children}</span>
  );
}

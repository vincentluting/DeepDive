"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";
import { HeaderShell } from "./header-shell";

export function ReportHeader({ locale }: { locale: Locale }) {
  const dict = getDictionaryClient(locale);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <HeaderShell className="relative">
      {/* Scroll progress indicator */}
      <div
        className="absolute bottom-0 left-0 h-[1px] transition-opacity duration-300"
        style={{
          width: `${scrollProgress * 100}%`,
          background: `linear-gradient(90deg, var(--depth-reef), var(--depth-mid))`,
          opacity: scrollProgress > 0.01 ? 1 : 0,
        }}
      />
      {/* Left — Back + Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <Link
          href={`/${locale}/reports`}
          className="flex items-center justify-center w-11 h-11 rounded-full border border-border bg-background/85 hover:bg-accent active:bg-accent transition-all duration-200 shadow-sm backdrop-blur-sm"
          aria-label={dict.common.back}
          title={dict.common.back}
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Link>
        <Link
          href={`/${locale}/`}
          className="header-logo-link flex items-center gap-2 group shrink-0"
        >
          <Image
            src="/logo.svg"
            alt="Deep Dive"
            width={22}
            height={22}
            priority
            className="transition-transform duration-300 group-hover:scale-105"
          />
          <span className="text-[15px] font-semibold text-foreground tracking-[-0.01em] hidden sm:block">
            Deep Dive
          </span>
        </Link>
      </div>

      {/* Spacer */}
      <div className="flex-1 min-w-4" />
    </HeaderShell>
  );
}

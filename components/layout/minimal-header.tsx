"use client"

import Image from "next/image"
import Link from "next/link"
import type { Locale } from "@/lib/i18n/config"
import { HeaderShell } from "./header-shell"

interface MinimalHeaderProps {
  locale: Locale
}

export function MinimalHeader({ locale }: MinimalHeaderProps) {
  return (
    <HeaderShell>
      {/* Spacer to center logo */}
      <div className="flex-1" />

      {/* Center — Logo */}
      <Link href={`/${locale}/`} className="header-logo-link flex items-center gap-2 group shrink-0">
        <Image src="/logo.svg" alt="Deep Dive" width={26} height={26} priority className="transition-transform duration-300 group-hover:scale-105" />
        <span className="text-[16px] font-semibold text-foreground tracking-[-0.01em]">Deep Dive</span>
      </Link>

      {/* Spacer for symmetry */}
      <div className="flex-1" />
    </HeaderShell>
  )
}

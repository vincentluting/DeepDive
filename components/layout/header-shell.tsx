"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface HeaderShellProps {
  children: React.ReactNode
  className?: string
  /** Enable scroll-based backdrop change */
  trackScroll?: boolean
  /** Custom height CSS variable value (default 64px) */
  height?: string
}

export function HeaderShell({
  children,
  className,
  trackScroll = true,
  height = "64px",
}: HeaderShellProps) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    if (!trackScroll) return
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [trackScroll])

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 pointer-events-none header-backdrop",
        scrolled && "header-backdrop-scrolled",
        className,
      )}
      style={{ "--header-height": height } as React.CSSProperties}
    >
      <div className="w-full px-6 lg:px-10 flex items-center pointer-events-auto" style={{ height }}>
        {children}
      </div>
    </header>
  )
}

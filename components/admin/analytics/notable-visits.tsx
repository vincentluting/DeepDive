"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ChevronDown,
  ChevronUp,
  ChevronRight,
  RefreshCw,
  X,
  Telescope,
} from "lucide-react"
import { countryCodeToFlag } from "@/lib/utils/country-flags"
import type { Locale } from "@/lib/i18n/config"
import { getDictionaryClient, interpolate } from "@/lib/i18n/get-dictionary-client"
import { csrfFetch } from "@/lib/auth/csrf-client"
import { formatReasons, scoreTier } from "@/lib/analytics/notable-detection"
import { reportClientError } from "@/lib/observability/client-error";

// ── Types ────────────────────────────────────────

interface NotableVisitorSummary {
  pageCount: number
  deepestPage: string | null
  country: string | null
  city: string | null
  deviceType: string | null
  userAgent: string | null
  firstSeen: string
  lastSeen: string
}

interface NotableVisitor {
  id: string
  ipHash: string
  score: number
  reasons: string[]
  summary: NotableVisitorSummary | null
  detectedAt: string
  expiresAt: string
  dismissed: boolean
}

interface VisitorJourneyEvent {
  id: string
  path: string
  country: string | null
  city: string | null
  referer: string | null
  deviceType: string | null
  userId: string | null
  userEmail: string | null
  durationMs: number | null
  createdAt: string
}

interface VisitorJourney {
  ipHash: string
  events: VisitorJourneyEvent[]
  summary: {
    totalVisits: number
    firstVisit: string
    lastVisit: string
    spanMs: number
    isRegistered: boolean
    deepestPage: string | null
  }
}

// ── Helpers ──────────────────────────────────────

function formatTime(dateStr: string): string {
  const d = new Date(dateStr)
  const month = String(d.getUTCMonth() + 1).padStart(2, "0")
  const day = String(d.getUTCDate()).padStart(2, "0")
  const hours = String(d.getUTCHours()).padStart(2, "0")
  const minutes = String(d.getUTCMinutes()).padStart(2, "0")
  return `${month}/${day} ${hours}:${minutes} UTC`
}

function formatDuration(ms: number | null): string {
  if (!ms) return "—"
  const totalSec = Math.round(ms / 1000)
  const mins = Math.floor(totalSec / 60)
  const secs = totalSec % 60
  if (mins === 0) return `${secs}s`
  return `${mins}m ${secs}s`
}

function formatSpan(ms: number): string {
  if (ms < 60_000) return "<1m"
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`
  return `${(ms / 3_600_000).toFixed(1)}h`
}

function timeUntilExpiry(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now()
  if (ms <= 0) return "expired"
  const days = Math.floor(ms / (1000 * 60 * 60 * 24))
  const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  if (days > 0) return `${days}d ${hours}h`
  return `${hours}h`
}

function isDeepPage(path: string): boolean {
  return /\/(report|coaching|questionnaire|quickdive|explore)/.test(path)
}

function scoreColor(score: number): string {
  const tier = scoreTier(score)
  if (tier === "high") return "text-green-500"
  if (tier === "medium") return "text-amber-500"
  return "text-blue-500"
}

function scoreDot(score: number): string {
  const tier = scoreTier(score)
  if (tier === "high") return "🟢"
  if (tier === "medium") return "🟡"
  return "🔵"
}

function deviceEmoji(deviceType: string | null): string {
  if (deviceType === "tablet") return "📲"
  if (deviceType === "mobile") return "📱"
  return "💻"
}

// ── Main Component ───────────────────────────────

interface NotableVisitsProps {
  locale: Locale
}

export function NotableVisits({ locale }: NotableVisitsProps) {
  const nt = (getDictionaryClient(locale).admin?.notable || {}) as Record<string, string>
  const nl = (key: string, fallback: string): string => nt[key] || fallback

  const [visitors, setVisitors] = useState<NotableVisitor[]>([])
  const [expanded, setExpanded] = useState(true)
  const [scanning, setScanning] = useState(false)
  const [journeys, setJourneys] = useState<Record<string, VisitorJourney | null | "loading">>({})
  const [expandedJourneys, setExpandedJourneys] = useState<Set<string>>(new Set())

  const fetchVisitors = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/notable")
      if (!res.ok) return
      const json = await res.json()
      setVisitors(json.visitors ?? [])
    } catch (err) {
      reportClientError(err, { component: "NotableVisits", feature: "admin" });
    }
  }, [])

  useEffect(() => {
    fetchVisitors()
  }, [fetchVisitors])

  const handleRescan = async () => {
    setScanning(true)
    try {
      await csrfFetch("/api/admin/notable", { method: "POST" })
      await fetchVisitors()
    } catch (err) {
      reportClientError(err, { component: "NotableVisits", feature: "admin" });
    } finally {
      setScanning(false)
    }
  }

  const handleDismiss = async (ipHash: string) => {
    try {
      await csrfFetch("/api/admin/notable", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ipHash }),
      })
      setVisitors((prev) => prev.filter((v) => v.ipHash !== ipHash))
    } catch (err) {
      reportClientError(err, { component: "NotableVisits", feature: "admin" });
    }
  }

  const toggleJourney = async (ipHash: string) => {
    const isExpanded = expandedJourneys.has(ipHash)
    if (isExpanded) {
      setExpandedJourneys((prev) => { const s = new Set(prev); s.delete(ipHash); return s })
      return
    }
    setExpandedJourneys((prev) => new Set(prev).add(ipHash))
    if (journeys[ipHash] !== undefined) return
    setJourneys((prev) => ({ ...prev, [ipHash]: "loading" }))
    try {
      const res = await fetch(`/api/admin/analytics?journey=${encodeURIComponent(ipHash)}`)
      if (!res.ok) { setJourneys((prev) => ({ ...prev, [ipHash]: null })); return }
      const json = await res.json()
      setJourneys((prev) => ({ ...prev, [ipHash]: json.journey ?? null }))
    } catch {
      setJourneys((prev) => ({ ...prev, [ipHash]: null }))
    }
  }

  if (visitors.length === 0) return null

  const title = "📌 " + nl("title", "Notable Visitors")
  const subtitle = interpolate(nt.subtitle || "{count} real visitor(s) worth following (expires in 7 days)", { count: String(visitors.length) })

  return (
    <Card className="border-amber-500/40 bg-amber-500/5">
      <CardContent className="p-4 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Telescope className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-semibold text-amber-600 dark:text-amber-400">
              {title}
            </h3>
            <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/40 dark:text-amber-400">
              {visitors.length}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRescan}
              disabled={scanning}
              className="h-7 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10 text-xs"
              title={nl("rescan", "Rescan")}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanning ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0 text-amber-600 hover:text-amber-700 hover:bg-amber-500/10"
              onClick={() => setExpanded((prev) => !prev)}
              aria-label={expanded ? "Collapse" : "Expand"}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>

        {expanded && (
          <div className="space-y-2">
            {visitors.map((v) => {
              const isJourneyExpanded = expandedJourneys.has(v.ipHash)
              const journeyData = journeys[v.ipHash]
              const reasonText = formatReasons(v.reasons, locale === "zh" ? "zh" : "en")

              return (
                <div key={v.id} className="rounded-lg border border-amber-500/20 overflow-hidden">
                  {/* Main row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-amber-500/5">
                    {/* Score indicator */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-base leading-none">{scoreDot(v.score)}</span>
                      <code className="text-xs font-mono text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                        {v.ipHash.slice(0, 8)}...
                      </code>
                    </div>

                    {/* Location */}
                    {v.summary?.country && (
                      <span className="text-sm shrink-0">
                        {countryCodeToFlag(v.summary.country)}{" "}
                        <span className="text-xs text-muted-foreground">
                          {v.summary.country}{v.summary.city ? ` · ${v.summary.city}` : ""}
                        </span>
                      </span>
                    )}

                    {/* Score */}
                    <span className={`text-sm font-semibold shrink-0 ${scoreColor(v.score)}`}>
                      {interpolate(nt.score || "Score: {score}", { score: String(v.score) })}
                    </span>

                    {/* Reasons summary */}
                    <span className="text-xs text-muted-foreground flex-1 truncate" title={reasonText}>
                      {reasonText}
                    </span>

                    {/* Device + Time */}
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                      {deviceEmoji(v.summary?.deviceType ?? null)}
                      {" · "}
                      {formatTime(v.detectedAt)}
                      {" · "}
                      <span className="text-amber-600/70">
                        {interpolate(nt.expiresIn || "exp. {time}", { time: timeUntilExpiry(v.expiresAt) })}
                      </span>
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                        onClick={() => toggleJourney(v.ipHash)}
                        title={nl("viewJourney", "View journey")}
                      >
                        {isJourneyExpanded
                          ? <ChevronDown className="w-3.5 h-3.5" />
                          : <ChevronRight className="w-3.5 h-3.5" />
                        }
                        <span className="ml-1">{nl("expand", "Expand")}</span>
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-red-500"
                        onClick={() => handleDismiss(v.ipHash)}
                        title={nl("dismiss", "Dismiss")}
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  {/* Journey expanded */}
                  {isJourneyExpanded && (
                    <div className="px-3 pb-3 bg-muted/20 border-t border-amber-500/10">
                      {journeyData === "loading" ? (
                        <div className="text-xs text-muted-foreground animate-pulse py-2">
                          {nl("loadingJourney", "Loading journey...")}
                        </div>
                      ) : !journeyData ? (
                        <div className="text-xs text-muted-foreground py-2">
                          {nl("noJourneyData", "No journey data found")}
                        </div>
                      ) : (
                        <div className="space-y-1 pt-2">
                          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mb-2">
                            <span>
                              {interpolate(nt.nVisits || "{count} visits", { count: String(journeyData.summary.totalVisits) })}
                            </span>
                            <span>
                              {interpolate(nt.journeySpan || "Span: {span}", { span: formatSpan(journeyData.summary.spanMs) })}
                            </span>
                            {journeyData.summary.isRegistered && (
                              <Badge variant="outline" className="text-[9px] text-green-500 border-green-500/30 py-0 h-4">
                                {nl("registered", "Registered")}
                              </Badge>
                            )}
                            {journeyData.summary.deepestPage && (
                              <span className="text-green-500">
                                {interpolate(nt.deepestPage || "Deepest: {page}", { page: journeyData.summary.deepestPage })}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-col gap-0.5 max-h-40 overflow-y-auto">
                            {journeyData.events.map((ev, idx) => (
                              <div key={ev.id} className="flex items-center gap-2 text-xs">
                                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                  idx === 0 ? "bg-green-500" :
                                  isDeepPage(ev.path) ? "bg-blue-500" :
                                  ev.userId ? "bg-amber-500" : "bg-muted-foreground/40"
                                }`} />
                                <span className="text-muted-foreground/60 whitespace-nowrap shrink-0">
                                  {formatTime(ev.createdAt)}
                                </span>
                                <span className="text-foreground truncate">{ev.path}</span>
                                {ev.durationMs && (
                                  <span className="text-muted-foreground/50 shrink-0">{formatDuration(ev.durationMs)}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

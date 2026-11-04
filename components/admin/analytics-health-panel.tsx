"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Activity, RefreshCw, CheckCircle2, AlertTriangle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Locale } from "@/lib/i18n/config"
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client"
import type { AnalyticsHealth } from "@/lib/analytics/errors"

// ── Status helpers ────────────────────────────────

function statusConfig(count: number) {
  if (count === 0) return { color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200", Icon: CheckCircle2, iconColor: "text-emerald-500" }
  if (count <= 10) return { color: "text-amber-600", bg: "bg-amber-50 border-amber-200", Icon: AlertTriangle, iconColor: "text-amber-500" }
  return { color: "text-red-600", bg: "bg-red-50 border-red-200", Icon: XCircle, iconColor: "text-red-500" }
}

function formatRelative(isoStr: string): string {
  const diffMs = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diffMs / 60_000)
  if (mins < 1) return "<1m ago"
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

// ── Main Component ───────────────────────────────

export function AnalyticsHealthPanel({ locale }: { locale: Locale }) {
  const [health, setHealth] = useState<AnalyticsHealth | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const at = (getDictionaryClient(locale).admin?.analytics || {}) as Record<string, string>
  const l = (key: string, fallback: string) => at[key] || fallback

  const t = {
    title: l("healthTitle", "Analytics Health"),
    last1h: l("healthLast1h", "Last 1h"),
    last24h: l("healthLast24h", "Last 24h"),
    last7d: l("healthLast7d", "Last 7d"),
    errors: l("healthErrors", "errors"),
    byLayer: l("healthByLayer", "Errors by Layer (7d)"),
    layerCol: l("healthLayer", "Layer"),
    countCol: l("healthCount", "Count"),
    recentErrors: l("healthRecentErrors", "Recent Errors"),
    eventCol: l("healthEvent", "Event"),
    errorCol: l("healthError", "Error"),
    timeCol: at.time || "Time",
    noErrors: l("healthNoErrors", "No errors in the past 7 days"),
    loadFailed: l("healthLoadFailed", "Failed to load health data"),
    refresh: at.healthRefresh || "Refresh",
    healthy: l("healthStatusGood", "Healthy"),
    warning: l("healthStatusWarning", "Warning"),
    alert: l("healthStatusAlert", "Alert"),
  }

  const fetchHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/analytics?section=health")
      if (!res.ok) throw new Error(`Failed (${res.status})`)
      const data = await res.json()
      setHealth(data.health)
    } catch (err) {
      setError(err instanceof Error ? err.message : t.loadFailed)
    } finally {
      setLoading(false)
    }
  }, [t.loadFailed])

  useEffect(() => {
    fetchHealth()
  }, [fetchHealth])

  const overall1h = health?.errorsLast1h ?? 0
  const overallStatus = statusConfig(overall1h)
  const StatusIcon = overallStatus.Icon

  return (
    <div className="space-y-3">
      {/* Title + Refresh */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-foreground">{t.title}</h2>
          {!loading && health && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border ${overallStatus.bg} ${overallStatus.color}`}>
              <StatusIcon className={`w-3 h-3 ${overallStatus.iconColor}`} />
              {overall1h === 0 ? t.healthy : overall1h <= 10 ? t.warning : t.alert}
            </span>
          )}
        </div>
        <Button variant="ghost" size="sm" onClick={fetchHealth} disabled={loading} className="text-muted-foreground hover:text-foreground">
          <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? "animate-spin" : ""}`} />
          {t.refresh}
        </Button>
      </div>

      {error && (
        <Card className="bg-card border-border">
          <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
        </Card>
      )}

      {loading && !health && (
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Card key={i} className="bg-card border-border">
              <CardContent className="p-4">
                <div className="h-12 bg-muted/30 animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {health && (
        <>
          {/* Three error counters */}
          <div className="grid grid-cols-3 gap-3">
            {(
              [
                { label: t.last1h, count: health.errorsLast1h },
                { label: t.last24h, count: health.errorsLast24h },
                { label: t.last7d, count: health.errorsLast7d },
              ] as const
            ).map(({ label, count }) => {
              const s = statusConfig(count)
              const Icon = s.Icon
              return (
                <Card key={label} className={`border ${count > 0 ? s.bg : "bg-card border-border"}`}>
                  <CardContent className="p-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-4 h-4 shrink-0 ${s.iconColor}`} />
                      <div>
                        <p className="text-[11px] text-muted-foreground">{label}</p>
                        <p className={`text-lg font-bold ${s.color}`}>
                          {count}
                          <span className="text-[11px] font-normal ml-1 text-muted-foreground">{t.errors}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          {/* By-layer table */}
          {health.byLayer.length > 0 && (
            <Card className="bg-card border-border">
              <CardContent className="p-0">
                <div className="px-4 pt-3 pb-2 border-b border-border">
                  <p className="text-xs font-medium text-muted-foreground">{t.byLayer}</p>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs">{t.layerCol}</TableHead>
                      <TableHead className="text-muted-foreground text-xs text-right">{t.countCol}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {health.byLayer.map((row) => {
                      const s = statusConfig(row.count)
                      return (
                        <TableRow key={row.layer} className="border-border hover:bg-muted/30">
                          <TableCell className="py-2 text-xs font-mono text-foreground">{row.layer}</TableCell>
                          <TableCell className={`py-2 text-xs font-bold text-right ${s.color}`}>{row.count}</TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}

          {/* Recent 5 errors */}
          <Card className="bg-card border-border overflow-hidden">
            <div className="px-4 pt-3 pb-2 border-b border-border">
              <p className="text-xs font-medium text-muted-foreground">{t.recentErrors}</p>
            </div>
            {health.recentErrors.length === 0 ? (
              <div className="flex items-center gap-2 px-4 py-4 text-sm text-emerald-600">
                <CheckCircle2 className="w-4 h-4" />
                {t.noErrors}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      <TableHead className="text-muted-foreground text-xs whitespace-nowrap">{t.layerCol}</TableHead>
                      <TableHead className="text-muted-foreground text-xs whitespace-nowrap">{t.eventCol}</TableHead>
                      <TableHead className="text-muted-foreground text-xs">{t.errorCol}</TableHead>
                      <TableHead className="text-muted-foreground text-xs whitespace-nowrap">{t.timeCol}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {health.recentErrors.map((err, idx) => (
                      <TableRow key={idx} className="border-border hover:bg-muted/30">
                        <TableCell className="py-2 text-xs font-mono text-foreground whitespace-nowrap">{err.layer}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground whitespace-nowrap">{err.event ?? "—"}</TableCell>
                        <TableCell className="py-2 text-xs text-foreground max-w-[260px] truncate">{err.error}</TableCell>
                        <TableCell className="py-2 text-xs text-muted-foreground whitespace-nowrap">{formatRelative(err.createdAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

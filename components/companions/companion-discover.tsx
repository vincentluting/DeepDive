"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { interpolate } from "@/lib/i18n/get-dictionary-client";
import { getLocalizedField } from "@/lib/i18n/localize";
import { ARCHETYPE_MAP } from "@/lib/scoring/constants";
import { CompanionCard } from "@/components/companions/companion-card";
import type { Locale } from "@/lib/i18n/config";
import type {
  CompanionCandidate,
  CompanionConnectionBucketsWithProfiles,
  CompanionConnectionWithProfile,
} from "@/lib/types/companion";

type Tab = "discover" | "pending" | "friends";

interface CompanionDiscoverProps {
  locale: Locale;
  t: {
    pageTitle: string;
    pageSubtitle: string;
    tabsDiscover: string;
    tabsPending: string;
    tabsFriends: string;
    loading: string;
    errorLoad: string;
    retry: string;
    emptyDiscoverTitle: string;
    emptyDiscoverBody: string;
    matchScoreSuffix: string;
    matchInsightSame: string;
    matchInsightOpposite: string;
    sendRequest: string;
    sending: string;
    requestSentBadge: string;
    requestPlaceholder: string;
    requestCounter: string;
    requestCancel: string;
    requestSubmit: string;
    requestErrorGeneric: string;
    requestErrorDuplicate: string;
    requestErrorBlocked: string;
  };
  tConn: {
    incomingTitle: string;
    incomingEmpty: string;
    incomingMessage: string;
    outgoingTitle: string;
    outgoingEmpty: string;
    friendsTitle: string;
    friendsEmpty: string;
    actionAccept: string;
    actionDecline: string;
    actionCancel: string;
    actionUnfriend: string;
    actionViewProfile: string;
    confirmUnfriend: string;
    errorGeneric: string;
    errorConflict: string;
  };
}

export function CompanionDiscover({
  locale,
  t,
  tConn,
}: CompanionDiscoverProps) {
  const [tab, setTab] = useState<Tab>("discover");

  // Discover
  const [candidates, setCandidates] = useState<CompanionCandidate[] | null>(
    null,
  );
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [discoverError, setDiscoverError] = useState(false);

  // Connections (pending + friends)
  const [buckets, setBuckets] =
    useState<CompanionConnectionBucketsWithProfiles | null>(null);
  const [connLoading, setConnLoading] = useState(true);
  const [connError, setConnError] = useState(false);

  const loadDiscover = useCallback(async () => {
    setDiscoverLoading(true);
    setDiscoverError(false);
    try {
      const res = await fetch("/api/companions/discover", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        setDiscoverError(true);
        return;
      }
      const data = (await res.json()) as { candidates: CompanionCandidate[] };
      setCandidates(data.candidates);
    } catch {
      setDiscoverError(true);
    } finally {
      setDiscoverLoading(false);
    }
  }, []);

  const loadConnections = useCallback(async () => {
    setConnLoading(true);
    setConnError(false);
    try {
      const res = await fetch("/api/companions/connections", {
        credentials: "same-origin",
      });
      if (!res.ok) {
        setConnError(true);
        return;
      }
      const data = (await res.json()) as {
        buckets: CompanionConnectionBucketsWithProfiles;
      };
      setBuckets(data.buckets);
    } catch {
      setConnError(true);
    } finally {
      setConnLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDiscover();
    loadConnections();
  }, [loadDiscover, loadConnections]);

  const incomingCount = buckets?.incomingPending.length ?? 0;

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">
          {t.pageTitle}
        </h1>
        <p className="text-sm text-muted-foreground">{t.pageSubtitle}</p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label={t.pageTitle}
        className="flex items-center gap-1 border-b border-border"
      >
        <TabButton
          active={tab === "discover"}
          onClick={() => setTab("discover")}
          label={t.tabsDiscover}
        />
        <TabButton
          active={tab === "pending"}
          onClick={() => setTab("pending")}
          label={t.tabsPending}
          badge={incomingCount > 0 ? incomingCount : undefined}
        />
        <TabButton
          active={tab === "friends"}
          onClick={() => setTab("friends")}
          label={t.tabsFriends}
        />
      </div>

      {tab === "discover" && (
        <DiscoverTab
          candidates={candidates}
          loading={discoverLoading}
          error={discoverError}
          locale={locale}
          t={t}
          onRetry={loadDiscover}
          // After a successful request the candidate list shouldn't surface
          // that user again until next refresh — let the card own its own
          // "sent" state, plus refresh connections so the Pending tab shows
          // the new outgoing request.
          onRequestSent={loadConnections}
        />
      )}

      {tab === "pending" && (
        <PendingTab
          buckets={buckets}
          loading={connLoading}
          error={connError}
          locale={locale}
          tConn={tConn}
          onChange={() => {
            loadConnections();
            // Discover may now include a previously-pending user (if they declined),
            // so refresh that too.
            loadDiscover();
          }}
        />
      )}

      {tab === "friends" && (
        <FriendsTab
          buckets={buckets}
          loading={connLoading}
          error={connError}
          locale={locale}
          tConn={tConn}
          onChange={() => {
            loadConnections();
            loadDiscover();
          }}
        />
      )}
    </div>
  );
}

// ── Tab button ───────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  badge?: number;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`px-4 py-2 -mb-px border-b-2 text-sm font-medium transition-colors ${
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground"
      }`}
    >
      <span>{label}</span>
      {badge !== undefined && (
        <span className="ml-1.5 inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-semibold h-4 min-w-[16px] px-1.5">
          {badge}
        </span>
      )}
    </button>
  );
}

// ── Discover tab ─────────────────────────────────────────────

function DiscoverTab({
  candidates,
  loading,
  error,
  locale,
  t,
  onRetry,
  onRequestSent,
}: {
  candidates: CompanionCandidate[] | null;
  loading: boolean;
  error: boolean;
  locale: Locale;
  t: CompanionDiscoverProps["t"];
  onRetry: () => void;
  onRequestSent: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{t.loading}</span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-sm text-destructive">{t.errorLoad}</p>
        <Button size="sm" variant="outline" onClick={onRetry}>
          {t.retry}
        </Button>
      </div>
    );
  }
  if (!candidates || candidates.length === 0) {
    return (
      <div className="text-center py-12 space-y-2">
        <p className="text-base font-semibold text-foreground">
          {t.emptyDiscoverTitle}
        </p>
        <p className="text-sm text-muted-foreground">{t.emptyDiscoverBody}</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {candidates.map((c) => (
        <CompanionCard
          key={c.profile.userId}
          candidate={c}
          locale={locale}
          t={t}
          onRequestSent={onRequestSent}
        />
      ))}
    </div>
  );
}

// ── Pending tab ──────────────────────────────────────────────

function PendingTab({
  buckets,
  loading,
  error,
  locale,
  tConn,
  onChange,
}: {
  buckets: CompanionConnectionBucketsWithProfiles | null;
  loading: boolean;
  error: boolean;
  locale: Locale;
  tConn: CompanionDiscoverProps["tConn"];
  onChange: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-destructive py-12">{tConn.errorGeneric}</p>
    );
  }
  const incoming = buckets?.incomingPending ?? [];
  const outgoing = buckets?.outgoingPending ?? [];

  return (
    <div className="space-y-8">
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          {tConn.incomingTitle}
        </h2>
        {incoming.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tConn.incomingEmpty}</p>
        ) : (
          <div className="space-y-3">
            {incoming.map((entry) => (
              <ConnectionRow
                key={entry.connection.id}
                entry={entry}
                locale={locale}
                tConn={tConn}
                kind="incoming"
                onChange={onChange}
              />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-foreground">
          {tConn.outgoingTitle}
        </h2>
        {outgoing.length === 0 ? (
          <p className="text-sm text-muted-foreground">{tConn.outgoingEmpty}</p>
        ) : (
          <div className="space-y-3">
            {outgoing.map((entry) => (
              <ConnectionRow
                key={entry.connection.id}
                entry={entry}
                locale={locale}
                tConn={tConn}
                kind="outgoing"
                onChange={onChange}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ── Friends tab ──────────────────────────────────────────────

function FriendsTab({
  buckets,
  loading,
  error,
  locale,
  tConn,
  onChange,
}: {
  buckets: CompanionConnectionBucketsWithProfiles | null;
  loading: boolean;
  error: boolean;
  locale: Locale;
  tConn: CompanionDiscoverProps["tConn"];
  onChange: () => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }
  if (error) {
    return (
      <p className="text-sm text-destructive py-12">{tConn.errorGeneric}</p>
    );
  }
  const accepted = buckets?.accepted ?? [];

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold text-foreground">
        {tConn.friendsTitle}
      </h2>
      {accepted.length === 0 ? (
        <p className="text-sm text-muted-foreground">{tConn.friendsEmpty}</p>
      ) : (
        <div className="space-y-3">
          {accepted.map((entry) => (
            <ConnectionRow
              key={entry.connection.id}
              entry={entry}
              locale={locale}
              tConn={tConn}
              kind="friend"
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </section>
  );
}

// ── Connection row (used by both tabs) ──────────────────────

function ConnectionRow({
  entry,
  locale,
  tConn,
  kind,
  onChange,
}: {
  entry: CompanionConnectionWithProfile;
  locale: Locale;
  tConn: CompanionDiscoverProps["tConn"];
  kind: "incoming" | "outgoing" | "friend";
  onChange: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const profile = entry.other;
  const archetypeEntry = profile ? ARCHETYPE_MAP[profile.archetypeCode] : null;
  const archetypeLabel = archetypeEntry
    ? getLocalizedField(archetypeEntry, "label", locale)
    : "";

  const handle = async (
    method: "PATCH" | "DELETE",
    body?: Record<string, unknown>,
  ) => {
    if (busy) return;
    setBusy(true);
    setErrorMsg("");

    try {
      const res = await csrfFetch(
        `/api/companions/connections/${encodeURIComponent(entry.connection.id)}`,
        {
          method,
          headers: body ? { "Content-Type": "application/json" } : undefined,
          body: body ? JSON.stringify(body) : undefined,
        },
      );
      if (!res.ok) {
        if (res.status === 409) {
          setErrorMsg(tConn.errorConflict);
        } else {
          setErrorMsg(tConn.errorGeneric);
        }
        return;
      }
      onChange();
    } catch {
      setErrorMsg(tConn.errorGeneric);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground truncate">
            {profile?.displayName ?? "—"}
          </p>
          {archetypeLabel && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {archetypeLabel}
            </p>
          )}
          {profile?.bio && (
            <p className="text-xs text-foreground/80 mt-2 whitespace-pre-line">
              {profile.bio}
            </p>
          )}
          {kind === "incoming" && entry.connection.requesterMessage && (
            <p className="text-xs text-muted-foreground italic mt-2">
              {interpolate(tConn.incomingMessage, {
                message: entry.connection.requesterMessage,
              })}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        {kind === "incoming" && (
          <>
            <Button
              size="sm"
              onClick={() => handle("PATCH", { action: "accept" })}
              disabled={busy}
              className="gap-1.5"
            >
              {busy && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {tConn.actionAccept}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handle("PATCH", { action: "decline" })}
              disabled={busy}
            >
              {tConn.actionDecline}
            </Button>
          </>
        )}
        {kind === "outgoing" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handle("DELETE")}
            disabled={busy}
          >
            {tConn.actionCancel}
          </Button>
        )}
        {kind === "friend" && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm(tConn.confirmUnfriend)) handle("DELETE");
            }}
            disabled={busy}
          >
            {tConn.actionUnfriend}
          </Button>
        )}
      </div>
      {errorMsg && <p className="text-xs text-destructive">{errorMsg}</p>}
    </div>
  );
}

// Avoid unused-import warning for Link reserved for M3 profile detail routing
void Link;

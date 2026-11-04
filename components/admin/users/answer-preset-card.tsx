"use client";

import { useCallback, useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { csrfFetch } from "@/lib/auth/csrf-client";
import { reportClientError } from "@/lib/observability/client-error";
import type { Locale } from "@/lib/i18n/config";
import { getDictionaryClient } from "@/lib/i18n/get-dictionary-client";

interface PresetState {
  hasQuickDive: boolean;
  hasDeepDive: boolean;
  updatedAt: string;
}

/**
 * Dev tool: import the admin's own completed questionnaire answers as a
 * reusable test template (used by auto-fill). Lives at the bottom of
 * /admin/users — kept compact, it's a utility not a metric.
 */
export function AnswerPresetCard({ locale }: { locale: Locale }) {
  const [preset, setPreset] = useState<PresetState | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const dict = getDictionaryClient(locale).admin as Record<string, unknown>;
  const t = (dict.insights || {}) as Record<string, string>;

  const fetchPreset = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/answer-preset");
      if (!res.ok) return;
      const data = await res.json();
      if (data.preset) {
        setPreset({
          hasQuickDive: data.preset.hasQuickDive,
          hasDeepDive: data.preset.hasDeepDive,
          updatedAt: data.preset.updatedAt,
        });
      }
    } catch (err) {
      reportClientError(err, {
        component: "AnswerPresetCard",
        feature: "admin",
      });
    }
  }, []);

  useEffect(() => {
    void fetchPreset();
  }, [fetchPreset]);

  const handleImport = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await csrfFetch("/api/admin/answer-preset", {
        method: "POST",
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({ error: { message: "Import failed" } }));
        setMessage(data.error?.message || "Import failed");
        return;
      }
      const data = await res.json();
      setPreset({
        hasQuickDive: data.imported.quickDive,
        hasDeepDive: data.imported.deepDive,
        updatedAt: new Date().toISOString(),
      });
      setMessage(t.presetImported || "Preset saved successfully");
    } catch (err) {
      reportClientError(err, {
        component: "AnswerPresetCard",
        feature: "admin",
      });
      setMessage("Import failed");
    } finally {
      setLoading(false);
    }
  }, [t.presetImported]);

  const handleDelete = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await csrfFetch("/api/admin/answer-preset", {
        method: "DELETE",
      });
      if (!res.ok) return;
      setPreset(null);
      setMessage(t.presetDeleted || "Preset deleted");
    } catch (err) {
      reportClientError(err, {
        component: "AnswerPresetCard",
        feature: "admin",
      });
    } finally {
      setLoading(false);
    }
  }, [t.presetDeleted]);

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-500" />
              {t.presetTitle || "Answer Preset"}
            </h3>
            <p className="text-xs text-muted-foreground mt-1">
              {t.presetDesc ||
                "Import your latest completed questionnaire answers as a reusable test template."}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
            {preset && (
              <>
                <div className="flex flex-wrap gap-1.5 sm:mr-2">
                  {preset.hasQuickDive && (
                    <Badge variant="secondary" className="text-[10px]">
                      {t.presetHasQuickDive || "Quick Dive"}
                    </Badge>
                  )}
                  {preset.hasDeepDive && (
                    <Badge variant="secondary" className="text-[10px]">
                      {t.presetHasDeepDive || "Deep Dive"}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground sm:mr-2">
                  {t.presetUpdatedAt || "Updated"}:{" "}
                  {new Date(preset.updatedAt).toLocaleDateString()}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-destructive hover:text-destructive"
                  onClick={handleDelete}
                  disabled={loading}
                >
                  {loading
                    ? t.presetDeleting || "Deleting..."
                    : t.presetDelete || "Delete"}
                </Button>
              </>
            )}
            <Button
              variant={preset ? "outline" : "default"}
              size="sm"
              className="text-xs"
              onClick={handleImport}
              disabled={loading}
            >
              {loading
                ? t.presetImporting || "Importing..."
                : t.presetImport || "Import My Answers"}
            </Button>
          </div>
        </div>
        {message && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            {message}
          </p>
        )}
        {!preset && !message && (
          <p className="text-[11px] text-muted-foreground/60 mt-2">
            {t.presetEmpty || "No preset saved yet."}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, FileText, Users, ShieldAlert, ArrowRight } from "lucide-react";
import type { Panel3Pathway } from "@/lib/types";

interface SearchStrategySectionProps {
  strategy: Panel3Pathway["jobSearchStrategy"];
  t: Record<string, string>;
}

export function SearchStrategySection({
  strategy,
  t,
}: SearchStrategySectionProps) {
  return (
    <div className="space-y-4">
      {/* Positioning */}
      {strategy.positioning && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              {t.positioning}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground leading-relaxed">
              {strategy.positioning}
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Resume highlights */}
        {strategy.resumeHighlights?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="h-4 w-4 text-ocean" />
                {t.resumeHighlights}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {strategy.resumeHighlights.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <ArrowRight className="h-4 w-4 text-ocean shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Networking tips */}
        {strategy.networkingTips?.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-gold" />
                {t.networkingTips}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <ul className="space-y-2">
                {strategy.networkingTips.map((item, idx) => (
                  <li
                    key={idx}
                    className="flex items-start gap-2 text-sm text-muted-foreground"
                  >
                    <ArrowRight className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Constraint strategies */}
      {strategy.constraintStrategies?.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldAlert className="h-4 w-4 text-amber-500" />
              {t.constraintStrategies}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-3">
              {strategy.constraintStrategies.map((cs, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg"
                >
                  <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">
                    {cs.constraint}
                  </p>
                  <p className="text-sm text-muted-foreground">{cs.strategy}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

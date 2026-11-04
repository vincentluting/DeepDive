'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Focus, Loader2 } from 'lucide-react'
import type { Locale } from '@/lib/i18n/config'
import { RealConditionsForm } from '@/components/reality-conditions/real-conditions-form'
import type { RealConditions } from '@/lib/types'

interface InlineRealityFormProps {
  sessionId: string
  locale: Locale
  t: Record<string, string>
  existingConditions?: RealConditions | null
  onSuccess: () => void
}

export function InlineRealityForm({
  sessionId,
  locale,
  t,
  existingConditions,
  onSuccess,
}: InlineRealityFormProps) {
  const [formOpen, setFormOpen] = useState(false)

  return (
    <>
      <Card className="border-dashed border-primary/30 bg-primary/5 overflow-hidden">
        <CardContent className="p-6 sm:p-8 text-center">
          <div className="mb-4 mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Focus className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">
            {t.addRealityCtaTitle}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            {t.addRealityCtaBody}
          </p>
          <Button
            className="rounded-full px-8"
            onClick={() => setFormOpen(true)}
          >
            <Focus className="h-4 w-4 mr-2" />
            {t.fillConditions}
          </Button>
        </CardContent>
      </Card>

      <RealConditionsForm
        open={formOpen}
        onOpenChange={setFormOpen}
        sessionId={sessionId}
        locale={locale as Locale}
        existingConditions={existingConditions}
        onSuccess={onSuccess}
      />
    </>
  )
}

interface RegeneratingOverlayProps {
  t: Record<string, string>
}

export function RegeneratingOverlay({ t }: RegeneratingOverlayProps) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-sm text-muted-foreground">{t.regeneratingPanel3}</p>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Trash2, Loader2, AlertTriangle, Clock, ArrowLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
} from "@/components/ui/alert-dialog"
import { csrfFetch } from "@/lib/auth/csrf-client"
import { interpolate } from "@/lib/i18n/get-dictionary-client"

interface AccountDeletionCardProps {
  t: {
    deleteTitle: string
    deleteDesc: string
    deleteButton: string
    deleteWarning: string
    deleteSuccess: string
    deleteFailed: string
    coolingPeriod: string
    coolingPeriodDesc: string
    // Multi-step flow keys
    deleteStepInfoTitle: string
    deleteStepInfoWarning: string
    deleteStepInfoItems: string[]
    deleteStepInfoRetention: string
    deleteStepVerifyTitle: string
    deleteStepVerifyDesc: string
    deleteStepVerifyTypeLabel: string
    deleteStepVerifyTypeWord: string
    deleteStepVerifyPasswordLabel: string
    deleteStepVerifyPasswordPlaceholder: string
    deleteStepVerifyTypeError: string
    deleteStepVerifyPasswordError: string
    deleteStepVerifyGenericError: string
    deleteStepFinalTitle: string
    deleteStepFinalDesc: string
    deleteStepNext: string
    deleteStepBack: string
    deleteStepCancel: string
    deleteStepConfirmDelete: string
    deleteStepOf: string
  }
}

const TOTAL_STEPS = 3

export function AccountDeletionCard({ t }: AccountDeletionCardProps) {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [confirmText, setConfirmText] = useState("")
  const [password, setPassword] = useState("")
  const [confirmTextError, setConfirmTextError] = useState("")
  const [passwordError, setPasswordError] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const resetState = () => {
    setStep(1)
    setConfirmText("")
    setPassword("")
    setConfirmTextError("")
    setPasswordError("")
    setStatus("idle")
    setErrorMessage("")
  }

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      resetState()
    }
    setOpen(isOpen)
  }

  const isConfirmTextValid = confirmText === t.deleteStepVerifyTypeWord

  const handleStep2Continue = () => {
    let hasError = false

    if (!isConfirmTextValid) {
      setConfirmTextError(t.deleteStepVerifyTypeError)
      hasError = true
    } else {
      setConfirmTextError("")
    }

    if (!password) {
      setPasswordError(t.deleteStepVerifyPasswordLabel)
      hasError = true
    } else {
      setPasswordError("")
    }

    if (!hasError) {
      setStep(3)
    }
  }

  const handleDelete = async () => {
    setStatus("loading")
    setErrorMessage("")
    setPasswordError("")

    try {
      const res = await csrfFetch("/api/user-data/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      const data = await res.json()

      if (!res.ok) {
        const msg = data?.error?.message || data?.error || t.deleteFailed
        // Check if password was wrong
        if (res.status === 401 && typeof msg === "string" && msg.toLowerCase().includes("password")) {
          setPasswordError(t.deleteStepVerifyPasswordError)
          setStep(2)
          setStatus("idle")
          return
        }
        throw new Error(typeof msg === "string" ? msg : t.deleteFailed)
      }

      setStatus("success")
      setTimeout(() => {
        window.location.href = "/"
      }, 3000)
    } catch (err) {
      setStatus("error")
      setErrorMessage(err instanceof Error ? err.message : t.deleteFailed)
    }
  }

  const stepIndicator = (
    <p className="text-xs text-muted-foreground text-center mb-1">
      {interpolate(t.deleteStepOf, { current: String(step), total: String(TOTAL_STEPS) })}
    </p>
  )

  return (
    <Card className="border-destructive/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Trash2 className="h-4 w-4 text-destructive" />
          {t.deleteTitle}
        </CardTitle>
        <CardDescription>{t.deleteDesc}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Cooling period info */}
        <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">{t.coolingPeriod}</p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">{t.coolingPeriodDesc}</p>
          </div>
        </div>

        <p className="text-xs text-destructive/80">{t.deleteWarning}</p>

        <Button
          variant="destructive"
          className="w-full sm:w-auto"
          onClick={() => setOpen(true)}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          {t.deleteButton}
        </Button>

        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogContent className="sm:max-w-md">
            {/* Success state */}
            {status === "success" ? (
              <>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    {t.deleteTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription>{t.deleteSuccess}</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <p className="text-xs text-muted-foreground w-full text-center">
                    {/* Auto-redirecting... */}
                  </p>
                </AlertDialogFooter>
              </>
            ) : step === 1 ? (
              /* Step 1: Information */
              <>
                {stepIndicator}
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {t.deleteStepInfoTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription>{t.deleteStepInfoWarning}</AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-3">
                  {/* Data that will be removed */}
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <p className="text-sm font-medium text-foreground mb-2">{t.deleteWarning}</p>
                    <ul className="space-y-1.5">
                      {t.deleteStepInfoItems.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-destructive mt-1.5 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* 30-day retention notice */}
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                    <Clock className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-sm text-amber-800 dark:text-amber-200">{t.deleteStepInfoRetention}</p>
                  </div>
                </div>

                <AlertDialogFooter>
                  <Button variant="outline" onClick={() => handleOpenChange(false)}>
                    {t.deleteStepCancel}
                  </Button>
                  <Button variant="destructive" onClick={() => setStep(2)}>
                    {t.deleteStepNext}
                  </Button>
                </AlertDialogFooter>
              </>
            ) : step === 2 ? (
              /* Step 2: Verification */
              <>
                {stepIndicator}
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {t.deleteStepVerifyTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription>{t.deleteStepVerifyDesc}</AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4">
                  {/* Type DELETE */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="delete-confirm-text">
                      {t.deleteStepVerifyTypeLabel}
                    </label>
                    <Input
                      id="delete-confirm-text"
                      value={confirmText}
                      onChange={(e) => {
                        setConfirmText(e.target.value)
                        setConfirmTextError("")
                      }}
                      placeholder={t.deleteStepVerifyTypeWord}
                      className={confirmTextError ? "border-destructive" : ""}
                      autoComplete="off"
                    />
                    {confirmTextError && (
                      <p className="text-xs text-destructive">{confirmTextError}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground" htmlFor="delete-confirm-password">
                      {t.deleteStepVerifyPasswordLabel}
                    </label>
                    <Input
                      id="delete-confirm-password"
                      type="password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value)
                        setPasswordError("")
                      }}
                      placeholder={t.deleteStepVerifyPasswordPlaceholder}
                      className={passwordError ? "border-destructive" : ""}
                      autoComplete="current-password"
                    />
                    {passwordError && (
                      <p className="text-xs text-destructive">{passwordError}</p>
                    )}
                  </div>
                </div>

                <AlertDialogFooter>
                  <Button variant="outline" onClick={() => setStep(1)}>
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    {t.deleteStepBack}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleStep2Continue}
                    disabled={!isConfirmTextValid || !password}
                  >
                    {t.deleteStepNext}
                  </Button>
                </AlertDialogFooter>
              </>
            ) : (
              /* Step 3: Final Confirmation */
              <>
                {stepIndicator}
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    {t.deleteStepFinalTitle}
                  </AlertDialogTitle>
                  <AlertDialogDescription>{t.deleteStepFinalDesc}</AlertDialogDescription>
                </AlertDialogHeader>

                {errorMessage && (
                  <div className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
                    {errorMessage}
                  </div>
                )}

                <AlertDialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                    disabled={status === "loading"}
                  >
                    {t.deleteStepCancel}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={status === "loading"}
                  >
                    {status === "loading" ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-2" />
                    )}
                    {t.deleteStepConfirmDelete}
                  </Button>
                </AlertDialogFooter>
              </>
            )}
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  )
}

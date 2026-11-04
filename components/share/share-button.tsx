"use client";

import {
  useState,
  useCallback,
  useRef,
  useEffect,
  type CSSProperties,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExplorerCertificate } from "./explorer-certificate";
import { generateShareCardDataUrl, dataUrlToBlob } from "@/lib/share";
import { getArchetypeContent } from "@/lib/content";
import { Check, Copy } from "lucide-react";
import { getLocalizedField } from "@/lib/i18n/localize";
import {
  getDictionaryClient,
  interpolate,
} from "@/lib/i18n/get-dictionary-client";
import type { Locale } from "@/lib/i18n/config";
import { sendAnalyticsSafely } from "@/lib/analytics/send-safely";

interface ShareButtonProps {
  /** Archetype code, e.g. "R-enhancement", "I-transcendence" */
  code: string;
  /** Locale for language ordering */
  locale: string;
  /** Accent color hex from the archetype */
  color: string;
  /** Rarity percentage */
  rare: number;
  /** Button label text (localized) */
  buttonLabel: string;
  /** Localized "Copy Caption" label */
  copyCaptionLabel?: string;
  /** Localized "Caption Copied!" label */
  captionCopiedLabel?: string;
  /** Called when the share modal is opened (e.g. for analytics tracking) */
  onOpen?: () => void;
  /** Optional className override for the trigger button */
  className?: string;
  /** Optional style override for the trigger button */
  style?: CSSProperties;
}

function buildCaption(code: string, locale: string, rare: number): string {
  const content = getArchetypeContent(code);
  if (!content) return "";

  const t = getDictionaryClient(locale as Locale).shareCard;
  const primaryLabel = getLocalizedField(content, "label", locale as Locale);
  const secondaryLabel = getLocalizedField(
    content,
    "label",
    locale === "zh" ? "en" : "zh",
  );
  const tagline = getLocalizedField(content, "tagline", locale as Locale);

  return interpolate(t.captionTemplate, {
    primaryLabel,
    secondaryLabel,
    rare,
    tagline,
  });
}

export function ShareButton({
  code,
  locale,
  color,
  rare,
  buttonLabel,
  copyCaptionLabel,
  captionCopiedLabel,
  onOpen,
  className,
  style,
}: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [captionCopied, setCaptionCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const t = getDictionaryClient(locale as Locale).shareCard;
  const a11y = getDictionaryClient(locale as Locale).a11y;

  const copyLabel = copyCaptionLabel || t.copyCaptionText;
  const copiedLabel = captionCopiedLabel || t.captionCopied;

  // When the modal opens, generate the share card PNG
  useEffect(() => {
    if (!open) {
      setImageUrl(null);
      setCaptionCopied(false);
      return;
    }

    let cancelled = false;

    async function loadAndGenerate() {
      setGenerating(true);

      try {
        // Wait for React to render
        await new Promise<void>((r) =>
          requestAnimationFrame(() => requestAnimationFrame(() => r())),
        );

        if (cancelled || !cardRef.current) return;

        const url = await generateShareCardDataUrl(cardRef.current);
        if (!cancelled) setImageUrl(url);
      } catch {
        // Generation failure is non-fatal
      } finally {
        if (!cancelled) setGenerating(false);
      }
    }

    loadAndGenerate();
    return () => {
      cancelled = true;
    };
  }, [open, code]);

  const handleDownload = useCallback(() => {
    if (!imageUrl) return;
    const link = document.createElement("a");
    link.download = `deep-dive-${code.toLowerCase()}-${Date.now()}.png`;
    link.href = imageUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [imageUrl, code]);

  const handleShare = useCallback(async () => {
    if (!imageUrl) return;

    try {
      const blob = dataUrlToBlob(imageUrl);

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], `deep-dive-${code.toLowerCase()}.png`, {
          type: "image/png",
        });
        const shareData = { files: [file] };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return;
        }
      }
      // Fallback: download
      handleDownload();
    } catch {
      // User cancelled share or share failed — fallback to download
      handleDownload();
    }
  }, [imageUrl, code, handleDownload]);

  const handleCopyCaption = useCallback(async () => {
    const caption = buildCaption(code, locale, rare);
    if (!caption) return;

    try {
      await navigator.clipboard.writeText(caption);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = caption;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCaptionCopied(true);
      setTimeout(() => setCaptionCopied(false), 2000);
    }
  }, [code, locale, rare]);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => {
          onOpen?.();
          setOpen(true);
          sendAnalyticsSafely("/api/analytics/event", {
            event: "share_clicked",
            metadata: { archetypeCode: code, locale },
          });
        }}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={
          className ??
          "w-full py-3.5 rounded-lg text-sm font-semibold cursor-pointer tracking-wide mb-5 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
        }
        style={
          style ?? {
            background: "var(--glass-shallow)",
            border: "1px solid var(--card-border-subtle)",
            color: "var(--foreground)",
          }
        }
      >
        {buttonLabel}
      </button>

      {/* Hidden card for html-to-image capture */}
      <div
        style={{
          position: "fixed",
          left: -9999,
          top: 0,
          pointerEvents: "none",
        }}
        aria-hidden="true"
      >
        <ExplorerCertificate
          ref={cardRef}
          code={code}
          locale={locale}
          color={color}
          rare={rare}
        />
      </div>

      {/* Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4"
            onClick={() => setOpen(false)}
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />

            {/* Modal content */}
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={buttonLabel}
              initial={{ opacity: 0, scale: 0.85, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-10 flex flex-col items-center max-w-[calc(100vw-2rem)] sm:max-w-[400px] w-full"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setOpen(false)}
                className="absolute -top-3 -right-3 z-20 w-9 h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
                aria-label={a11y.close}
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path
                    d="M4 4L12 12M12 4L4 12"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {/* Card preview */}
              <div className="w-full rounded-xl overflow-hidden shadow-2xl mb-5">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={`${code} share card`}
                    className="w-full h-auto"
                    draggable={false}
                  />
                ) : (
                  <div
                    className="w-full flex items-center justify-center"
                    style={{
                      aspectRatio: "1/1",
                      background: "linear-gradient(180deg, #011828, #000C18)", // brand: --color-abyss / --color-abyss-darker
                    }}
                  >
                    <div className="text-white/60 text-sm">
                      {generating ? t.generatingCard : ""}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 w-full">
                <button
                  onClick={handleDownload}
                  disabled={!imageUrl}
                  className="flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "rgba(255,255,255,0.85)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  {t.saveImage}
                </button>
                <button
                  onClick={handleShare}
                  disabled={!imageUrl}
                  className="flex-1 py-3 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 active:scale-[0.98]"
                  style={{
                    background: "rgba(34,211,238,0.15)",
                    border: "1px solid rgba(34,211,238,0.3)",
                    color: "rgba(34,211,238,0.9)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                  }}
                >
                  {t.shareButton}
                </button>
              </div>

              {/* Copy Caption button */}
              <button
                onClick={handleCopyCaption}
                className="mt-3 w-full py-2.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-1.5"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: captionCopied
                    ? "rgba(34,211,238,0.9)"
                    : "rgba(255,255,255,0.55)",
                }}
              >
                {captionCopied ? (
                  <>
                    <Check className="h-3.5 w-3.5" />
                    {copiedLabel}
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    {copyLabel}
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

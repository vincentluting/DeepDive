"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";

import { cn } from "@/lib/utils";

interface PortalOverlayProps {
  /** Whether the overlay is open. */
  open: boolean;
  /** Controlled open-change. Fires with `false` on ESC, backdrop click, or
   *  the close affordance — the parent decides whether to actually close
   *  (e.g. keep open mid-upload). */
  onOpenChange: (open: boolean) => void;
  /** Accessible title. Rendered visually-hidden for screen readers; the
   *  visible heading lives inside `children`. */
  title: string;
  /** Class applied to the centered panel — controls width, surface, radius. */
  className?: string;
  /** Class applied to the backdrop (e.g. add `backdrop-blur-sm`). */
  overlayClassName?: string;
  children: React.ReactNode;
}

/**
 * PortalOverlay — viewport-centered modal primitive.
 *
 * Renders into `document.body` via Radix Portal, so it escapes any
 * transformed/filtered ancestor that would otherwise hijack `position: fixed`
 * (the root cause behind dimension cards opening off-screen). Focus trap, ESC
 * handling, scroll-lock and ARIA wiring come from Radix Dialog for free.
 *
 * Centering uses a flex container rather than `translate(-50%,-50%)` so the
 * `zoom-in` entrance transform never fights the centering transform.
 */
export function PortalOverlay({
  open,
  onOpenChange,
  title,
  className,
  overlayClassName,
  children,
}: PortalOverlayProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-[var(--z-overlay-backdrop)] bg-black/40",
            "data-[state=open]:animate-in data-[state=open]:fade-in-0",
            "data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
            overlayClassName,
          )}
        />
        {/* Centering layer — pointer-events-none lets clicks on the empty
            area fall through to the Overlay for dismissal. */}
        <div className="fixed inset-0 z-[var(--z-overlay)] flex items-center justify-center p-4 sm:p-6 pointer-events-none">
          <DialogPrimitive.Content
            aria-describedby={undefined}
            className={cn(
              "pointer-events-auto w-full max-w-[min(600px,92vw)] max-h-[85dvh] overflow-y-auto outline-none",
              "data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
              "data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
              className,
            )}
          >
            <DialogPrimitive.Title className="sr-only">
              {title}
            </DialogPrimitive.Title>
            {children}
          </DialogPrimitive.Content>
        </div>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

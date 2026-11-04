"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { csrfFetch } from "@/lib/auth/csrf-client";
import type { VariantProps } from "class-variance-authority";
import type { buttonVariants } from "@/components/ui/button";

interface CheckoutButtonProps {
  tier: "report" | "journey" | "coaching";
  locale: string;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
  className?: string;
  children: React.ReactNode;
}

export function CheckoutButton({
  tier,
  locale,
  variant = "gradient",
  size = "lg",
  className,
  children,
}: CheckoutButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    setLoading(true);

    try {
      const res = await csrfFetch("/api/stripe/checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-locale": locale,
        },
        body: JSON.stringify({ tier }),
      });

      if (res.status === 401) {
        // Not logged in — redirect to login with return URL
        router.push(`/${locale}/login?returnUrl=/${locale}/pricing`);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        console.error("[checkout] Error:", data.error || res.statusText);
        // Stripe not configured yet — fall through to explore page
        router.push(`/${locale}/explore`);
        return;
      }

      const { url } = await res.json();
      if (url) {
        window.location.href = url;
      }
    } catch {
      // Network error or Stripe not configured — fall through
      router.push(`/${locale}/explore`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleCheckout}
      disabled={loading}
    >
      {loading ? "..." : children}
    </Button>
  );
}

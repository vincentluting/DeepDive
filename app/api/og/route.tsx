// ============================================================
// GET /api/og — Dynamic Open Graph Image Generator
//
// Generates a 1200×630 OG image for social media previews.
// Two modes:
//   1. Generic: ?title=...&subtitle=...&locale=en|zh
//   2. Archetype: ?code=R&name=探索者&subtitle=...&color=E8763A&locale=zh
//      Personalized card for share pages — shows type identity.
//
// Uses Next.js built-in ImageResponse (next/og), zero dependencies.
// ============================================================

import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";

// Node.js runtime: the edge bundle exceeds the 1 MB Hobby-plan limit.
export const runtime = "nodejs";

/** Parse hex color to rgba string */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get("code");
  const locale = searchParams.get("locale") || "en";

  // ── Mode 2: Archetype card ──────────────────────────────
  if (code) {
    const name = searchParams.get("name") || code.toUpperCase();
    const subtitle = searchParams.get("subtitle") || "";
    const color = searchParams.get("color") || "5A7AB0";
    const secondaryName = searchParams.get("secondary") || "";

    return new ImageResponse(
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: `linear-gradient(160deg, #020a14 0%, ${hexToRgba(color, 0.15)} 45%, #020810 100%)`,
          fontFamily: "system-ui, -apple-system, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Ambient glow behind type icon */}
        <div
          style={{
            position: "absolute",
            width: "600px",
            height: "600px",
            borderRadius: "50%",
            background: `radial-gradient(circle, ${hexToRgba(color, 0.18)} 0%, ${hexToRgba(color, 0.04)} 50%, transparent 70%)`,
            top: "-60px",
            left: "50%",
            marginLeft: "-300px",
          }}
        />

        {/* Decorative border */}
        <div
          style={{
            position: "absolute",
            top: 24,
            left: 24,
            right: 24,
            bottom: 24,
            borderRadius: 20,
            border: `1px solid ${hexToRgba(color, 0.18)}`,
          }}
        />

        {/* Type icon square */}
        <div
          style={{
            width: "88px",
            height: "88px",
            borderRadius: "20px",
            background: `linear-gradient(135deg, #${color}, ${hexToRgba(color, 0.7)})`,
            boxShadow: `0 8px 40px ${hexToRgba(color, 0.35)}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "32px",
          }}
        >
          <span
            style={{
              fontSize: "48px",
              fontWeight: 700,
              color: "rgba(255,255,255,0.95)",
              lineHeight: 1,
            }}
          >
            {name.charAt(0)}
          </span>
        </div>

        {/* Type code badge */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 24px",
            borderRadius: 100,
            background: hexToRgba(color, 0.1),
            border: `1px solid ${hexToRgba(color, 0.22)}`,
            marginBottom: "24px",
          }}
        >
          <span
            style={{
              fontSize: "16px",
              fontWeight: 600,
              letterSpacing: "6px",
              color: hexToRgba(color, 0.85),
              textTransform: "uppercase" as const,
            }}
          >
            {code.split("-")[0].toUpperCase()}
          </span>
        </div>

        {/* Primary name */}
        <div
          style={{
            fontSize: "72px",
            fontWeight: 800,
            color: "#ffffff",
            textAlign: "center",
            lineHeight: 1.15,
            maxWidth: "900px",
            letterSpacing: "-1px",
          }}
        >
          {name}
        </div>

        {/* Secondary name */}
        {secondaryName && (
          <div
            style={{
              fontSize: "30px",
              fontWeight: 500,
              color: hexToRgba(color, 0.85),
              marginTop: "12px",
              letterSpacing: "2px",
            }}
          >
            {secondaryName}
          </div>
        )}

        {/* Subtitle / tagline */}
        {subtitle && (
          <div
            style={{
              fontSize: "24px",
              color: "rgba(255,255,255,0.55)",
              marginTop: "20px",
              textAlign: "center",
              maxWidth: "700px",
              lineHeight: 1.5,
            }}
          >
            {subtitle}
          </div>
        )}

        {/* Bottom brand */}
        <div
          style={{
            position: "absolute",
            bottom: "36px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            color: "rgba(255,255,255,0.3)",
            fontSize: "18px",
            letterSpacing: "0.15em",
          }}
        >
          deepdive.app
        </div>
      </div>,
      { width: 1200, height: 630 },
    );
  }

  // ── Mode 1: Generic card ────────────────────────────────
  const title = searchParams.get("title") || "Deep Dive";
  const subtitle = searchParams.get("subtitle");
  const OG_SUBTITLES: Record<string, string> = {
    en: "Discover Your Career Identity",
    zh: "发现你的职业身份",
  };
  const defaultSubtitle = OG_SUBTITLES[locale] ?? OG_SUBTITLES.en;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(145deg, #020E1A 0%, #0A2A4A 40%, #0A3A5C 70%, #041520 100%)",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Decorative light pools */}
      <div
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(100,180,240,0.08) 0%, transparent 70%)",
          top: "-200px",
          right: "-100px",
        }}
      />
      <div
        style={{
          position: "absolute",
          width: "400px",
          height: "400px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(60,140,200,0.06) 0%, transparent 70%)",
          bottom: "-100px",
          left: "-50px",
        }}
      />

      {/* Logo / Brand mark */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "40px",
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #0A4A7C, #0A3A5C)",
            border: "2px solid rgba(100,180,240,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(100,180,240,0.9)"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            <path d="M2 12h20" />
          </svg>
        </div>
      </div>

      {/* Title */}
      <div
        style={{
          fontSize: "64px",
          fontWeight: 700,
          color: "#E8F4F8",
          textAlign: "center",
          lineHeight: 1.2,
          maxWidth: "900px",
          padding: "0 40px",
        }}
      >
        {title}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: "28px",
          color: "rgba(100,180,240,0.8)",
          marginTop: "20px",
          textAlign: "center",
          maxWidth: "700px",
          lineHeight: 1.4,
        }}
      >
        {subtitle || defaultSubtitle}
      </div>

      {/* Bottom brand line */}
      <div
        style={{
          position: "absolute",
          bottom: "40px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          color: "rgba(232,244,248,0.3)",
          fontSize: "18px",
          letterSpacing: "0.1em",
        }}
      >
        deepdive.app
      </div>
    </div>,
    {
      width: 1200,
      height: 630,
    },
  );
}

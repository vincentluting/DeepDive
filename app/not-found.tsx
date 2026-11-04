import Link from "next/link";
import { headers } from "next/headers";
import { getDictionary } from "@/lib/i18n/get-dictionary";

export default async function NotFound() {
  // Detect locale from referer URL or accept-language header
  const hdrs = await headers();
  const referer = hdrs.get("referer") ?? "";
  const locale = referer.includes("/zh") ? "zh" : "en";
  const dict = await getDictionary(locale);
  const t = dict.notFoundPage;

  return (
    <html lang={locale}>
      <body
        style={{
          margin: 0,
          fontFamily: "system-ui, -apple-system, sans-serif",
          background: "#020E1A",
          color: "#E8F4F8",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{ textAlign: "center", padding: "2rem", maxWidth: "480px" }}
        >
          {/* Deep sea depth visual */}
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background:
                "radial-gradient(circle at 40% 40%, #0A3A5C, #020E1A)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 2rem",
            }}
          >
            <svg
              width="36"
              height="36"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(100,180,240,0.7)"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v4M12 16h.01" />
            </svg>
          </div>

          <h1
            style={{
              fontSize: "1rem",
              fontWeight: 500,
              color: "rgba(100,180,240,0.8)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: "0 0 1rem",
            }}
          >
            404
          </h1>

          <h2
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              margin: "0 0 1rem",
              color: "#E8F4F8",
            }}
          >
            {t.title}
          </h2>

          <p
            style={{
              color: "rgba(232,244,248,0.5)",
              lineHeight: 1.6,
              margin: "0 0 2.5rem",
              fontSize: "0.95rem",
            }}
          >
            {t.description}
          </p>

          <Link
            href={`/${locale}`}
            style={{
              display: "inline-block",
              padding: "0.75rem 2rem",
              borderRadius: "0.5rem",
              background: "linear-gradient(135deg, #0A4A7C, #0A3A5C)",
              color: "#E8F4F8",
              textDecoration: "none",
              fontWeight: 500,
              fontSize: "0.95rem",
              border: "1px solid rgba(100,180,240,0.2)",
            }}
          >
            {t.backToHome}
          </Link>
        </div>
      </body>
    </html>
  );
}

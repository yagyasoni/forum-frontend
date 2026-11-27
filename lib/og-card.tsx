// The branded link-preview card (1200 x 630) shared by the site-wide image and each thread's image.

import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };

let logo: Promise<string> | null = null;
/** The AuditProRx mark as a data URL, read once per server process. */
export function logoDataUrl() {
  logo ??= readFile(join(process.cwd(), "app/icon.png"), "base64").then((b64) => `data:image/png;base64,${b64}`);
  return logo;
}

export function OgCard({
  logoSrc,
  eyebrow,
  title,
  footer,
}: {
  logoSrc: string;
  eyebrow?: string;
  title: string;
  footer?: string;
}) {
  const size = title.length > 90 ? 52 : title.length > 55 ? 60 : 70;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        background: "#f7f7f8",
        color: "#18181b",
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={logoSrc} width={72} height={72} style={{ borderRadius: 16 }} alt="" />
        <div style={{ display: "flex", flexDirection: "column" }}>
          <span style={{ fontSize: 34, fontWeight: 700 }}>AuditProRx</span>
          <span style={{ fontSize: 20, letterSpacing: 4, color: "#71717a" }}>COMMUNITY</span>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {eyebrow && (
          <span
            style={{
              display: "flex",
              alignSelf: "flex-start",
              padding: "8px 18px",
              borderRadius: 10,
              background: "#ccfbf1",
              color: "#0f766e",
              fontSize: 26,
              fontWeight: 600,
            }}
          >
            {eyebrow}
          </span>
        )}
        <span style={{ fontSize: size, fontWeight: 700, lineHeight: 1.15 }}>{title}</span>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 24, color: "#71717a" }}>
        <span>{footer ?? "Independent pharmacies comparing notes"}</span>
        <span style={{ display: "flex", width: 160, height: 8, borderRadius: 8, background: "#0f766e" }} />
      </div>
    </div>
  );
}

import { ImageResponse } from "next/og";
import { OG_SIZE, OgCard, logoDataUrl } from "@/lib/og-card";

// Site-wide link preview (Home, categories, and any page without its own image).
export const alt = "AuditProRx Community: PBM audits, claim rejections and pharmacy Q&A";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <OgCard
        logoSrc={await logoDataUrl()}
        title="PBM audits, claim rejections and pharmacy Q&A"
        footer="forum.auditprorx.com"
      />
    ),
    size,
  );
}

import { ImageResponse } from "next/og";
import { getThreadPreview } from "@/lib/api";
import { isPrototypeId } from "@/lib/member-mock";
import { OG_SIZE, OgCard, logoDataUrl } from "@/lib/og-card";

// Link preview for one thread: a branded card with the category, the title and the reply count.
// A thread that has its own photo uses that photo instead (see generateMetadata in page.tsx), so
// nothing here depends on fetching outside images. Fetching the thread never counts a view.
export const alt = "Thread on AuditProRx Community";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = isPrototypeId(id) ? null : await getThreadPreview(id).catch(() => null);
  // Missing, deleted, members-only, or not a thread id at all: there is nothing to preview.
  if (!data) return new Response("Not found", { status: 404 });

  const { thread } = data;
  return new ImageResponse(
    (
      <OgCard
        logoSrc={await logoDataUrl()}
        eyebrow={thread.category.name}
        title={thread.title}
        footer={`${thread.commentCount} ${thread.commentCount === 1 ? "reply" : "replies"} · forum.auditprorx.com`}
      />
    ),
    size,
  );
}

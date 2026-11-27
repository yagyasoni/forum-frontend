import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import PrototypeThread from "@/components/PrototypeThread";
import ThreadView from "@/components/ThreadView";
import { getThread } from "@/lib/api";
import { isPrototypeId } from "@/lib/member-mock";
import { absoluteUrl, describe, jsonLd, NO_INDEX, openGraph, plainText, previewPhoto } from "@/lib/seo";
import type { ThreadDetail } from "@/lib/types";

export default function Page(props: PageProps<"/t/[id]">) {
  // params is request data, so the part that reads it streams in behind Suspense.
  return (
    <Suspense fallback={<ThreadSkeleton />}>
      <Thread params={props.params} />
    </Suspense>
  );
}

async function Thread({ params }: { params: PageProps<"/t/[id]">["params"] }) {
  const { id } = await params;
  // Member prototype: sample member threads and threads posted in this browser live in the browser only.
  if (isPrototypeId(id)) return <PrototypeThread id={id} />;
  await connection(); // "5h ago" labels use the current time, so render this at request time
  const data = await getThread(id);
  if (!data) notFound();
  return (
    <>
      {/* Structured data: the thread as a forum post, and its breadcrumb trail. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(threadJsonLd(data))} />
      <ThreadView data={data} />
    </>
  );
}

export async function generateMetadata(props: PageProps<"/t/[id]">): Promise<Metadata> {
  const { id } = await props.params;
  // Sample member threads exist only in the browser and are for members: keep them out of search.
  if (isPrototypeId(id)) return { title: "Thread", robots: NO_INDEX };
  const data = await getThread(id); // deduped with the page's call, see lib/api.ts
  // Missing, deleted, or members-only. Search engines get their page head before anything is sent,
  // so raising not-found here gives them a real 404 status instead of a 200 "not found" page.
  if (!data) notFound();

  const { thread } = data;
  const path = `/t/${thread.id}`;
  const description = describe(plainText(thread.body)) || thread.title;
  // The thread's own photo is the preview image when it has one. Without `images` here, the branded
  // card from opengraph-image.tsx in this folder is used.
  const photo = previewPhoto(thread.imageUrl);
  return {
    title: thread.title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({
      type: "article",
      title: thread.title,
      description,
      url: path,
      publishedTime: thread.createdAt,
      modifiedTime: thread.lastActivityAt,
      section: thread.category.name,
      ...(photo && { images: [{ url: photo, alt: thread.title }] }),
    }),
    twitter: { card: "summary_large_image", title: thread.title, description },
  };
}

/** schema.org DiscussionForumPosting (what Google reads for forum threads) plus BreadcrumbList. */
function threadJsonLd({ thread, comments }: ThreadDetail) {
  const url = absoluteUrl(`/t/${thread.id}`);
  const person = (name: string | null | undefined) => ({ "@type": "Person", name: name || "Member" });
  const counter = (type: string, count: number) => ({
    "@type": "InteractionCounter",
    interactionType: `https://schema.org/${type}`,
    userInteractionCount: count,
  });
  const image = previewPhoto(thread.imageUrl);
  const text = plainText(thread.body) || thread.title; // a post must have text for search engines

  return [
    {
      "@context": "https://schema.org",
      "@type": "DiscussionForumPosting",
      "@id": url,
      url,
      mainEntityOfPage: url,
      headline: thread.title,
      text,
      ...(image && { image }),
      datePublished: thread.createdAt,
      dateModified: thread.lastActivityAt,
      author: person(thread.author.username),
      articleSection: thread.category.name,
      interactionStatistic: [counter("CommentAction", comments.length), counter("ViewAction", thread.viewCount)],
      comment: comments.map((c) => ({
        "@type": "Comment",
        text: plainText(c.body),
        datePublished: c.createdAt,
        author: person(c.author.username),
        interactionStatistic: counter("LikeAction", c.likeCount),
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Home", item: absoluteUrl("/") },
        {
          "@type": "ListItem",
          position: 2,
          name: thread.category.name,
          item: absoluteUrl(`/?category=${encodeURIComponent(thread.category.slug)}`),
        },
        { "@type": "ListItem", position: 3, name: thread.title, item: url },
      ],
    },
  ];
}

function ThreadSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-32 rounded bg-line" />
      <div className="card space-y-3 p-6">
        <div className="h-5 w-24 rounded bg-line" />
        <div className="h-7 w-3/4 rounded bg-line" />
        <div className="h-4 w-1/2 rounded bg-line" />
        <div className="h-24 rounded bg-line" />
      </div>
    </div>
  );
}

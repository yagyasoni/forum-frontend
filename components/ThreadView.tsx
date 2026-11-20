import Link from "next/link";
import { ChevronRight, Eye, Lock, Pin } from "lucide-react";
import AuthorLine from "./AuthorLine";
import Avatar from "./Avatar";
import CopyLink from "./CopyLink";
import ImageLightbox from "./ImageLightbox";
import { ReportButton, SaveButton } from "./MemberBits";
import ThreadComments from "./ThreadComments";
import { VoteButtons } from "./ThreadCard";
import type { ThreadDetail } from "@/lib/types";
import { compact, timeAgo } from "@/lib/utils";

/** One open thread: the post, its actions, and the comments (reply box for members, sign-in prompt for visitors). */
export default function ThreadView({ data }: { data: ThreadDetail }) {
  const { thread, comments } = data;

  return (
    <article className="space-y-4">
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm text-muted">
        <Link href="/" className="hover:text-fg">
          Home
        </Link>
        <ChevronRight size={14} />
        <Link href={`/?category=${thread.category.slug}`} className="hover:text-fg">
          {thread.category.name}
        </Link>
      </nav>

      <div className="card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="chip">{thread.category.name}</span>
          {thread.isPinned && (
            <span className="inline-flex items-center gap-1 text-accent">
              <Pin size={13} /> Pinned
            </span>
          )}
          {thread.isLocked && (
            <span className="inline-flex items-center gap-1 text-muted">
              <Lock size={13} /> Locked
            </span>
          )}
        </div>

        <h1 className="mt-2 text-xl font-semibold tracking-tight leading-snug sm:text-2xl">{thread.title}</h1>

        <div className="mt-4 flex items-center gap-3">
          <Avatar username={thread.author.username} />
          <div className="min-w-0 text-sm">
            <AuthorLine author={thread.author} />
            <p className="flex flex-wrap items-center gap-x-2 text-xs text-muted">
              <time dateTime={thread.createdAt} suppressHydrationWarning>
                Posted {timeAgo(thread.createdAt)}
              </time>
              <span aria-hidden>·</span>
              <span className="inline-flex items-center gap-1">
                <Eye size={13} /> {compact(thread.viewCount)} views
              </span>
            </p>
          </div>
        </div>

        {/* Body is sanitized HTML from the backend. */}
        <div className="post-body mt-5" dangerouslySetInnerHTML={{ __html: thread.body }} />

        {thread.imageUrl && (
          <div className="mt-4">
            <ImageLightbox src={thread.imageUrl} />
          </div>
        )}

        {/* Every control here is the same 28px height as the vote box. */}
        <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-line pt-4">
          <VoteButtons threadId={thread.id} score={thread.likeCount} />
          <SaveButton thread={thread} className="btn-ghost h-7 px-2.5 text-xs" />
          <CopyLink className="btn-ghost h-7 px-2.5 text-xs" />
          <ReportButton className="btn-ghost ml-auto h-7 px-2.5 text-xs text-muted" />
        </div>
      </div>

      <ThreadComments
        threadId={thread.id}
        opUsername={thread.author.username}
        isLocked={thread.isLocked}
        comments={comments}
      />
    </article>
  );
}

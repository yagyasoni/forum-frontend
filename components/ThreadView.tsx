import Link from "next/link";
import { BadgeCheck, Bookmark, ChevronRight, Eye, Flag, Heart, Lock, MessageSquare, Pin } from "lucide-react";
import Avatar from "./Avatar";
import CopyLink from "./CopyLink";
import ImageLightbox from "./ImageLightbox";
import { SignInButton } from "./SignInDialog";
import { VoteButtons } from "./ThreadCard";
import { ROLE_LABEL, type Author, type ThreadDetail } from "@/lib/types";
import { compact, timeAgo } from "@/lib/utils";

/** One open thread: the post, its comments, and the sign-in prompt in place of a reply box. */
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
          <VoteButtons score={thread.likeCount} />
          <SignInButton className="btn-ghost h-7 px-2.5 text-xs">
            <Bookmark size={14} /> Save
          </SignInButton>
          <CopyLink className="btn-ghost h-7 px-2.5 text-xs" />
          <SignInButton className="btn-ghost ml-auto h-7 px-2.5 text-xs text-muted">
            <Flag size={14} /> Report
          </SignInButton>
        </div>
      </div>

      <section>
        <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
          <MessageSquare size={16} />
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h2>

        {comments.length > 0 && (
          <ol className="card divide-y divide-line">
            {comments.map((c) => (
              <li key={c.id} className="flex gap-3 p-4 sm:p-5">
                <Avatar username={c.author.username} size="sm" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <AuthorLine author={c.author} />
                    {c.author.username === thread.author.username && (
                      <span className="rounded border border-line px-1.5 text-[10.5px] font-semibold text-muted uppercase">
                        OP
                      </span>
                    )}
                    <span aria-hidden className="text-muted">·</span>
                    <time dateTime={c.createdAt} className="text-xs text-muted" suppressHydrationWarning>
                      {timeAgo(c.createdAt)}
                    </time>
                  </div>
                  <div className="post-body mt-1.5 text-sm leading-6" dangerouslySetInnerHTML={{ __html: c.body }} />
                  <SignInButton className="mt-2 inline-flex items-center gap-1 text-xs text-muted hover:text-fg">
                    <Heart size={13} /> {c.likeCount}
                  </SignInButton>
                </div>
              </li>
            ))}
          </ol>
        )}

        <div className="card mt-3 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-line text-muted">
              <MessageSquare size={15} />
            </span>
            <p className="text-sm text-muted">
              {thread.isLocked ? "This thread is locked." : "Have an answer? Join the discussion."}
            </p>
          </div>
          {!thread.isLocked && (
            <SignInButton className="btn-primary w-full shrink-0 sm:w-auto">Sign in to comment</SignInButton>
          )}
        </div>
      </section>
    </article>
  );
}

function AuthorLine({ author }: { author: Author }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="font-medium text-fg">{author.username}</span>
      <span className="text-muted">{ROLE_LABEL[author.role]}</span>
      {author.verified && (
        <span className="inline-flex items-center gap-0.5 text-xs text-accent">
          <BadgeCheck size={13} /> Verified Pharmacy
        </span>
      )}
    </span>
  );
}

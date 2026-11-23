"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { ArrowBigDown, ArrowBigUp, BadgeCheck, ChevronDown, Eye, Loader2, Lock, MessageSquare, Pin } from "lucide-react";
import Avatar from "./Avatar";
import ImageLightbox from "./ImageLightbox";
import { SignInButton } from "./SignInDialog";
import { getComments, voteThread } from "@/lib/api";
import { addComment, useLocalComments, useMember, usePrototypeThread } from "@/lib/member";
import { isPrototypeId } from "@/lib/member-mock";
import { ROLE_LABEL, type Comment, type ThreadRow } from "@/lib/types";
import { getLocalVote, setLocalVote, subscribeVotes, type VoteValue } from "@/lib/votes";
import { compact, cx, timeAgo } from "@/lib/utils";

/** One thread as a card: author line, title, excerpt, optional image, votes, and comments that expand in place. */
export default function ThreadCard({ thread }: { thread: ThreadRow }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[] | null>(null); // null = not loaded yet
  const [optimistic, setOptimistic] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reply, setReply] = useState("");
  const member = useMember();
  const mine = useLocalComments(thread.id);
  const prototype = usePrototypeThread(thread.id);
  const shown = [...(comments ?? []), ...mine, ...optimistic];
  const commentCount = thread.commentCount + mine.length + optimistic.length;

  async function submitReply(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!reply.trim() || submitting || !member) return;
    const trimmed = reply.trim();
    setReply("");
    setSubmitting(true);
    setOptimistic((prev) => [
      ...prev,
      {
        id: `opt-${Date.now()}`,
        author: { username: member.profile.username, role: member.profile.role, verified: member.verified },
        body: trimmed.split(/\n{2,}/).map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`).join(""),
        likeCount: 0,
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      await addComment(thread.id, trimmed);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleComments() {
    if (!open && comments === null && isPrototypeId(thread.id)) {
      setComments([]); // prototype threads are no longer local; real threads load from server
    } else if (!open && comments === null) {
      setLoading(true);
      try {
        setComments(await getComments(thread.id));
      } finally {
        setLoading(false);
      }
    }
    setOpen((o) => !o);
  }

  return (
    <article className="rounded-md border border-line bg-surface shadow-xs">
      <div className="p-4">
        {/* Author line */}
        <div className="flex items-center gap-2.5 text-xs">
          <Avatar username={thread.author.username} size="sm" />
          <p className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5 text-muted">
            <span className="font-medium text-fg">{thread.author.username}</span>
            <span>{ROLE_LABEL[thread.author.role]}</span>
            {thread.author.verified && (
              <span className="inline-flex items-center gap-0.5 text-accent">
                <BadgeCheck size={13} /> Verified Pharmacy
              </span>
            )}
            <span aria-hidden>·</span>
            <span className="chip">{thread.category.name}</span>
            <span aria-hidden>·</span>
            <time dateTime={thread.lastActivityAt} suppressHydrationWarning>
              {timeAgo(thread.lastActivityAt)}
            </time>
          </p>
          {thread.isPinned && (
            <span className="ml-auto inline-flex shrink-0 items-center gap-1 text-accent">
              <Pin size={13} /> Pinned
            </span>
          )}
          {thread.isLocked && (
            <span className={cx("inline-flex shrink-0 items-center gap-1 text-muted", !thread.isPinned && "ml-auto")}>
              <Lock size={13} /> Locked
            </span>
          )}
        </div>

        {/* Title and excerpt */}
        <h2 className="mt-2.5 text-[15px] font-semibold leading-snug">
          <Link href={`/t/${thread.id}`} className="hover:underline">
            {thread.title}
          </Link>
        </h2>
        <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted">{thread.excerpt}</p>

        {/* Optional image, opens full size on click */}
        {thread.imageUrl && (
          <div className="mt-3">
            <ImageLightbox src={thread.imageUrl} crop />
          </div>
        )}

        {/* Actions */}
        <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
          <VoteButtons threadId={thread.id} score={thread.likeCount} />
          <button
            type="button"
            onClick={toggleComments}
            aria-expanded={open}
            className="btn-ghost h-7 gap-1.5 px-2 text-xs"
          >
            <MessageSquare size={14} />
            {commentCount} {commentCount === 1 ? "comment" : "comments"}
            <ChevronDown size={13} className={cx("transition-transform", open && "rotate-180")} />
          </button>
          <span className="ml-auto inline-flex items-center gap-1 text-xs text-muted tabular-nums">
            <Eye size={14} /> {compact(thread.viewCount)}
          </span>
        </div>
      </div>

      {/* Comments, expanded in place */}
      {open && (
        <div className="border-t border-line bg-bg px-4 py-3">
          {loading ? (
            <p className="flex items-center gap-2 text-xs text-muted">
              <Loader2 size={13} className="animate-spin" /> Loading comments…
            </p>
          ) : shown.length > 0 ? (
            <ol className="max-h-72 space-y-3 overflow-y-auto [scrollbar-width:thin] [scrollbar-color:var(--color-line)_transparent]">
              {shown.map((c) => (
                <li key={c.id} className="flex gap-2.5">
                  <Avatar username={c.author.username} size="sm" className="mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <p className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted">
                      <span className="font-medium text-fg">{c.author.username}</span>
                      <span>{ROLE_LABEL[c.author.role]}</span>
                      <span aria-hidden>·</span>
                      <time dateTime={c.createdAt} suppressHydrationWarning>
                        {timeAgo(c.createdAt)}
                      </time>
                    </p>
                    {/* Comment bodies are sanitized HTML from the backend. */}
                    <div className="post-body mt-0.5 text-sm leading-6 break-words" dangerouslySetInnerHTML={{ __html: c.body }} />
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-xs text-muted">No comments yet.</p>
          )}

          {member && !thread.isLocked ? (
            <form onSubmit={submitReply} className="mt-3 flex items-center gap-2">
              <Avatar username={member.profile.username} size="sm" />
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                placeholder="Write a comment"
                aria-label="Write a comment"
                maxLength={5000}
                className="input h-8 min-w-0 flex-1 text-xs"
              />
              <button type="submit" disabled={!reply.trim() || submitting} className="btn-primary inline-flex h-8 shrink-0 items-center gap-1.5 px-2.5 text-xs">
                {submitting && <Loader2 size={11} className="animate-spin" />}
                Comment
              </button>
            </form>
          ) : (
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-xs text-muted">{thread.isLocked ? "This thread is locked." : "Have an answer?"}</p>
              {!thread.isLocked && (
                <SignInButton className="btn-primary guest-only h-7 px-2.5 text-xs">Sign in to comment</SignInButton>
              )}
            </div>
          )}
        </div>
      )}
    </article>
  );
}

/**
 * Up / score / down. Works without an account: every click is recorded on the server under a
 * random id this browser keeps, one vote per browser per thread. Clicking the same arrow again
 * removes the vote. The arrow state is remembered on the device so it shows correctly on reload.
 */
export function VoteButtons({ threadId, score: initialScore }: { threadId: string; score: number }) {
  // This browser's vote lives in device storage; 0 on the server render, then the stored value.
  // The score from the server already includes this browser's earlier vote, if any.
  const vote = useSyncExternalStore(subscribeVotes, () => getLocalVote(threadId), () => 0 as VoteValue);
  const [score, setScore] = useState(initialScore);
  const [busy, setBusy] = useState(false);

  async function cast(next: 1 | -1) {
    if (busy) return;
    const value: VoteValue = vote === next ? 0 : next;
    const before = { vote, score };
    setLocalVote(threadId, value); // arrow updates right away
    setScore(score + value - vote); // and so does the score
    if (isPrototypeId(threadId)) return; // sample and locally posted threads are not on the server
    setBusy(true);
    try {
      const result = await voteThread(threadId, value);
      setScore(result.score);
    } catch (err) {
      console.error("Vote failed", err);
      setLocalVote(threadId, before.vote);
      setScore(before.score);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="inline-flex h-7 items-center rounded-md border border-line bg-surface">
      <button
        type="button"
        onClick={() => cast(1)}
        aria-label="Upvote"
        aria-pressed={vote === 1}
        className={cx(
          "grid h-full w-7 cursor-pointer place-items-center rounded-l-md hover:bg-bg",
          vote === 1 ? "text-accent" : "text-muted hover:text-accent",
        )}
      >
        <ArrowBigUp size={16} fill={vote === 1 ? "currentColor" : "none"} />
      </button>
      <span className="min-w-6 px-1 text-center text-xs font-semibold tabular-nums">{score}</span>
      <button
        type="button"
        onClick={() => cast(-1)}
        aria-label="Downvote"
        aria-pressed={vote === -1}
        className={cx(
          "grid h-full w-7 cursor-pointer place-items-center rounded-r-md hover:bg-bg",
          vote === -1 ? "text-fg" : "text-muted hover:text-fg",
        )}
      >
        <ArrowBigDown size={16} fill={vote === -1 ? "currentColor" : "none"} />
      </button>
    </div>
  );
}

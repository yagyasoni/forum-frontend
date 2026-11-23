"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Heart, Loader2, MessageSquare } from "lucide-react";
import Avatar from "./Avatar";
import AuthorLine from "./AuthorLine";
import { SignInButton, useSignIn } from "./SignInDialog";
import { addComment, useLocalComments, useMember } from "@/lib/member";
import { likeComment } from "@/lib/api";
import type { Comment } from "@/lib/types";
import { cx, timeAgo } from "@/lib/utils";

/**
 * Comments under an open thread. Visitors see the sign-in prompt; members get a reply box and
 * can like a comment. Prototype: a member's replies and likes stay in this browser.
 */
export default function ThreadComments({
  threadId,
  opUsername,
  isLocked,
  comments: fromServer,
}: {
  threadId: string;
  opUsername: string;
  isLocked: boolean;
  comments: Comment[];
}) {
  const router = useRouter();
  const member = useMember();
  const signIn = useSignIn();
  const [optimistic, setOptimistic] = useState<Comment[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Clear optimistic comments once the server refresh brings them in.
  useEffect(() => { setOptimistic([]); }, [fromServer.length]);

  // Seed liked state from server data (restores state after page refresh).
  // Key on the actual likedByMe values so the effect only runs when server data changes,
  // not on every render. Only ADD from server — never remove — to avoid fighting optimistic updates.
  const serverLikedKey = fromServer.map((c) => `${c.id}:${c.likedByMe ? 1 : 0}`).join(",");
  useEffect(() => {
    setLiked((prev) => {
      const next = new Set(prev);
      for (const c of fromServer) {
        if (c.likedByMe) next.add(c.id);
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverLikedKey]);

  const comments = [...fromServer, ...useLocalComments(threadId), ...optimistic];

  async function like(id: string) {
    if (!member) return signIn();
    const isLiked = liked.has(id);
    // Optimistic update
    setLiked((prev) => { const s = new Set(prev); isLiked ? s.delete(id) : s.add(id); return s; });
    try {
      const { likeCount } = await likeComment(threadId, id);
      setLikeCounts((prev) => ({ ...prev, [id]: likeCount }));
    } catch {
      // Revert on error
      setLiked((prev) => { const s = new Set(prev); isLiked ? s.add(id) : s.delete(id); return s; });
    }
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim() || submitting || !member) return;
    const trimmed = text.trim();
    setText("");
    setSubmitting(true);
    // Show comment immediately without waiting for server refresh.
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
      await addComment(threadId, trimmed);
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section>
      <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <MessageSquare size={16} />
        {comments.length} {comments.length === 1 ? "comment" : "comments"}
      </h2>

      {comments.length > 0 && (
        <ol className="card divide-y divide-line">
          {comments.map((c) => {
            const isLiked = liked.has(c.id) && !!member;
            const displayCount = likeCounts[c.id] ?? c.likeCount;
            return (
              <li key={c.id} className="flex gap-3 p-4 sm:p-5">
                <Avatar username={c.author.username} size="sm" className="mt-0.5" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <AuthorLine author={c.author} />
                    {c.author.username === opUsername && (
                      <span className="rounded border border-line px-1.5 text-[10.5px] font-semibold text-muted uppercase">
                        OP
                      </span>
                    )}
                    <span aria-hidden className="text-muted">·</span>
                    <time dateTime={c.createdAt} className="text-xs text-muted" suppressHydrationWarning>
                      {timeAgo(c.createdAt)}
                    </time>
                  </div>
                  <div className="post-body mt-1.5 text-sm leading-6 break-words" dangerouslySetInnerHTML={{ __html: c.body }} />
                  <button
                    type="button"
                    onClick={() => like(c.id)}
                    aria-pressed={isLiked}
                    aria-label="Like"
                    className={cx(
                      "mt-2 inline-flex cursor-pointer items-center gap-1 text-xs hover:text-fg",
                      isLiked ? "text-rose-600 hover:text-rose-600 dark:text-rose-400" : "text-muted",
                    )}
                  >
                    <Heart size={13} fill={isLiked ? "currentColor" : "none"} /> {displayCount}
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {member && !isLocked ? (
        <form onSubmit={submit} className="card mt-3 flex gap-3 p-4">
          <span className="hidden sm:block">
            <Avatar username={member.profile.username} />
          </span>
          <div className="min-w-0 flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write a reply"
              rows={3}
              maxLength={5000}
              className="input h-auto min-h-20 resize-y py-2 leading-6"
            />
            <div className="mt-2 flex items-center justify-between gap-3">
              <p className="text-xs text-muted">Never include patient names or prescription numbers.</p>
              <button type="submit" disabled={!text.trim() || submitting} className="btn-primary inline-flex h-8 shrink-0 items-center gap-1.5 px-3 text-xs">
                {submitting && <Loader2 size={12} className="animate-spin" />}
                Reply
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="card mt-3 flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-dashed border-line text-muted">
              <MessageSquare size={15} />
            </span>
            <p className="text-sm text-muted">
              {isLocked ? "This thread is locked." : "Have an answer? Join the discussion."}
            </p>
          </div>
          {!isLocked && (
            <SignInButton className="btn-primary guest-only w-full shrink-0 sm:w-auto">Sign in to comment</SignInButton>
          )}
        </div>
      )}
    </section>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import { Loader2, MessageSquare, ThumbsUp } from "lucide-react";
import Avatar from "./Avatar";
import AuthorLine from "./AuthorLine";
import { SignInButton, useSignIn } from "./SignInDialog";
import { mergeComments } from "@/lib/live";
import { addComment, toggleLike, useAddedComments, useLike, useMember } from "@/lib/member";
import type { Comment } from "@/lib/types";
import { cx, timeAgo, writeErrorMessage } from "@/lib/utils";

/**
 * Comments under an open thread. Visitors see the sign-in prompt; members get a reply box and
 * can like a comment. Replies and likes show at once and are sent to the server in one request.
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
  const member = useMember();
  // Server comments plus the ones this member added here or on a Home card, each shown once.
  const comments = mergeComments(fromServer, useAddedComments(threadId));
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!text.trim() || submitting || !member) return;
    const trimmed = text.trim();
    setText("");
    setSubmitting(true);
    setSubmitError(null);
    try {
      await addComment(threadId, trimmed); // shows immediately, one request, undone if refused
    } catch (err) {
      setText(trimmed);
      setSubmitError(writeErrorMessage(err));
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
          {comments.map((c) => (
            <CommentItem key={c.id} threadId={threadId} comment={c} isOp={c.author.username === opUsername} />
          ))}
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
              <p className={cx("text-xs", submitError ? "text-rose-600 dark:text-rose-400" : "text-muted")}>
                {submitError ?? "Never include patient names or prescription numbers."}
              </p>
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

/** One comment with its like button. The like state is shared, so it survives moving between screens. */
function CommentItem({ threadId, comment: c, isOp }: { threadId: string; comment: Comment; isOp: boolean }) {
  const member = useMember();
  const signIn = useSignIn();
  const like = useLike(c);
  const isLiked = like.liked && !!member;
  const pending = c.id.startsWith("pending-"); // still on its way to the server

  return (
    <li className="flex gap-3 p-4 sm:p-5">
      <Avatar username={c.author.username} size="sm" className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <AuthorLine author={c.author} />
          {isOp && (
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
          onClick={() => (member ? toggleLike(threadId, c.id, like) : signIn())}
          disabled={pending}
          aria-pressed={isLiked}
          aria-label="Like"
          className={cx(
            "mt-2 inline-flex cursor-pointer items-center gap-1 text-xs hover:text-fg",
            isLiked ? "text-rose-600 hover:text-rose-600 dark:text-rose-400" : "text-muted",
          )}
        >
          <ThumbsUp size={13} fill={isLiked ? "currentColor" : "none"} /> {like.count}
        </button>
      </div>
    </li>
  );
}

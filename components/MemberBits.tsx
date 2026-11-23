"use client";

// Small pieces that look different for a visitor and a signed-in member.
// The visitor side of each one is the same markup the visitor prototype shipped with.

import { useRef, useState, useSyncExternalStore, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Bookmark, Check, Flag, PenLine, X } from "lucide-react";
import Avatar from "./Avatar";
import Logo from "./Logo";
import { SignInButton, useSignIn } from "./SignInDialog";
import ThreadCard from "./ThreadCard";
import { toggleSaved, useMember, usePosts, useSaved } from "@/lib/member";
import type { ThreadRow } from "@/lib/types";
import { cx } from "@/lib/utils";

/** False on the server and the first paint, true once the browser state has been read. */
export function useHydrated() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}

/** First card on Home. Visitors: what this place is. Members: start a post. */
export function HomeIntro() {
  const member = useMember();

  if (!member) {
    return (
      <section className="card guest-only flex items-start gap-3 p-3.5">
        <Logo size={32} className="hidden sm:block" />
        <div className="min-w-0 flex-1">
          <h1 className="text-sm font-semibold tracking-tight">AuditProRx Community</h1>
          <p className="mt-0.5 text-xs leading-5 text-muted">
            Independent pharmacies comparing notes on PBM audits, claim rejections, wholesaler invoices, and
            compliance. Read freely, sign in to join.
          </p>
          <SignInButton className="btn-primary mt-2.5 h-7 px-2.5 text-xs">Join the community</SignInButton>
        </div>
      </section>
    );
  }

  return (
    <section className="card flex items-start gap-3 p-3.5">
      <span className="hidden sm:block">
        <Avatar username={member.profile.username} />
      </span>
      <div className="min-w-0 flex-1">
        <h1 className="text-sm font-semibold tracking-tight">Welcome back, {member.profile.username}</h1>
        <p className="mt-0.5 text-xs leading-5 text-muted">Ask a question or share what worked at your pharmacy.</p>
        <Link
          href="/new"
          className="mt-2.5 flex h-9 items-center gap-2 rounded-lg border border-line bg-bg px-3 text-sm text-muted transition-colors hover:border-accent hover:text-fg"
        >
          <PenLine size={15} /> Create a post
        </Link>
      </div>
    </section>
  );
}

/** Threads the member posted in this browser, shown above the live list on the first page. */
export function LocalPosts({ category }: { category?: string }) {
  const member = useMember();
  const posts = usePosts().filter((p) => !category || p.category.slug === category);
  if (!member || posts.length === 0) return null;
  return (
    <div className="space-y-3">
      {posts.map((p) => (
        <ThreadCard key={p.id} thread={p} />
      ))}
    </div>
  );
}

/** Right rail button: "Sign in to post" for visitors, "New post" for members. */
export function PostCta({ className }: { className?: string }) {
  const member = useMember();
  if (!member) return <SignInButton className={cx(className, "guest-only")}>Sign in to post</SignInButton>;
  return (
    <Link href="/new" className={className}>
      New post
    </Link>
  );
}

/** Save on the thread page. Visitors are asked to sign in. */
export function SaveButton({ thread, className }: { thread: ThreadRow; className?: string }) {
  const member = useMember();
  const signIn = useSignIn();
  const serverSaved = useSaved().some((t) => t.id === thread.id) && !!member;
  const [optimistic, setOptimistic] = useState<boolean | null>(null);
  const isSaved = optimistic !== null ? optimistic : serverSaved;

  function save() {
    if (!member) return signIn();
    const next = !isSaved;
    setOptimistic(next);
    const row = { ...thread } as ThreadRow & { body?: string };
    delete row.body;
    toggleSaved(row, isSaved);
  }

  return (
    <button type="button" onClick={save} aria-pressed={isSaved} className={className}>
      <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} /> {isSaved ? "Saved" : "Save"}
    </button>
  );
}

const REASONS = ["Patient information (PHI)", "Spam or advertising", "Harassment or abuse", "Something else"];

/** Report on the thread page: a short reason dialog. Prototype: nothing is sent anywhere. */
export function ReportButton({ className }: { className?: string }) {
  const member = useMember();
  const signIn = useSignIn();
  const ref = useRef<HTMLDialogElement>(null);
  const [reason, setReason] = useState(REASONS[0]);
  const [sent, setSent] = useState(false);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <>
      <button type="button" onClick={() => (member ? ref.current?.showModal() : signIn())} className={className}>
        <Flag size={14} /> Report
      </button>

      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current.close(); // click on the backdrop closes
        }}
        onClose={() => setSent(false)}
        className="m-auto w-[min(92vw,380px)] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/50"
      >
        <div className="p-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-base font-semibold tracking-tight">Report this thread</h2>
            <button
              type="button"
              onClick={() => ref.current?.close()}
              aria-label="Close"
              className="cursor-pointer rounded-md p-1 text-muted hover:bg-bg hover:text-fg"
            >
              <X size={18} />
            </button>
          </div>

          {sent ? (
            <p className="mt-4 flex items-center gap-2 text-sm">
              <Check size={16} className="text-accent" /> Thanks. A moderator will take a look.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-3 flex flex-col gap-1">
              {REASONS.map((r) => (
                <label key={r} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-bg">
                  <input type="radio" name="reason" checked={reason === r} onChange={() => setReason(r)} className="accent-current" />
                  {r}
                </label>
              ))}
              <button type="submit" className="btn-primary mt-3">
                Send report
              </button>
            </form>
          )}
        </div>
      </dialog>
    </>
  );
}

/** Shown on member pages (New post, Saved, My posts, Profile) when nobody is signed in. */
export function MembersOnly({ title, children }: { title: string; children: ReactNode }) {
  const member = useMember();
  const hydrated = useHydrated();
  if (member) return <>{children}</>;
  if (!hydrated) return <div className="h-40 animate-pulse rounded-lg bg-line" />;
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted">Sign in with AuditProRx or Google to continue.</p>
      <SignInButton className="btn-primary mt-4">Sign in</SignInButton>
    </div>
  );
}

/** Title row used at the top of the member pages. */
export function PageTitle({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
      {hint && <p className="mt-0.5 text-sm text-muted">{hint}</p>}
    </div>
  );
}

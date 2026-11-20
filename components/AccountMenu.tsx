"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, Bookmark, ChevronDown, FileText, LogOut, Plus, UserRound } from "lucide-react";
import Avatar from "./Avatar";
import { SignInButton } from "./SignInDialog";
import {
  DEMO_REPLY_DELAY_MS,
  addDemoReply,
  markNotificationsRead,
  pendingDemoReplies,
  signOut,
  useMember,
  useNotifications,
  usePosts,
} from "@/lib/member";
import { ROLE_LABEL } from "@/lib/types";
import { cx, timeAgo } from "@/lib/utils";

type Panel = "bell" | "account" | null;

/** Right end of the top bar. Visitors get Sign in; members get New post, the bell, and their menu. */
export default function AccountMenu() {
  const member = useMember();
  const notifications = useNotifications();
  const posts = usePosts();
  const [panel, setPanel] = useState<Panel>(null);
  const ref = useRef<HTMLDivElement>(null);

  // Close the open panel on a click outside or Escape.
  useEffect(() => {
    if (!panel) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [panel]);

  // Prototype only: a sample member replies a few seconds after you post, so the bell can be seen working.
  useEffect(() => {
    const timers = pendingDemoReplies().map((p) =>
      setTimeout(() => addDemoReply(p.id), Math.max(0, Date.parse(p.createdAt) + DEMO_REPLY_DELAY_MS - Date.now())),
    );
    return () => timers.forEach(clearTimeout);
  }, [posts]);

  if (!member) return <SignInButton className="btn-primary guest-only shrink-0">Sign in</SignInButton>;

  const unread = notifications.filter((n) => !n.isRead).length;

  function close() {
    if (panel === "bell") markNotificationsRead(); // seen once the list has been opened and closed
    setPanel(null);
  }
  const toggle = (next: Exclude<Panel, null>) => (panel === next ? close() : (close(), setPanel(next)));

  const panelClass =
    "card absolute top-full right-0 z-30 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden shadow-lg";
  const itemClass = "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-sm text-fg hover:bg-bg";

  return (
    <div ref={ref} className="relative flex shrink-0 items-center gap-1.5 sm:gap-2">
      <Link href="/new" aria-label="New post" className="btn-primary px-2.5 sm:px-3.5">
        <Plus size={16} />
        <span className="hidden sm:inline">New post</span>
      </Link>

      <button
        type="button"
        onClick={() => toggle("bell")}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={panel === "bell"}
        className="relative grid h-9 w-9 cursor-pointer place-items-center rounded-lg text-muted hover:bg-bg hover:text-fg"
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute top-1 right-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-600 px-1 text-[10px] font-semibold text-white tabular-nums">
            {unread}
          </span>
        )}
      </button>

      <button
        type="button"
        onClick={() => toggle("account")}
        aria-label="Account menu"
        aria-expanded={panel === "account"}
        className="flex h-9 cursor-pointer items-center gap-2 rounded-lg pr-1.5 pl-1 hover:bg-bg"
      >
        <Avatar username={member.profile.username} size="sm" />
        <span className="hidden max-w-32 truncate text-sm font-medium lg:block">{member.profile.username}</span>
        <ChevronDown size={14} className="hidden text-muted sm:block" />
      </button>

      {panel === "bell" && (
        <div className={panelClass}>
          <p className="border-b border-line px-3 py-2 text-sm font-semibold">Notifications</p>
          {notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-xs leading-5 text-muted">
              Nothing yet. You will see a note here when someone comments on your thread.
            </p>
          ) : (
            <ul className="max-h-80 divide-y divide-line overflow-y-auto">
              {notifications.map((n) => (
                <li key={n.id}>
                  <Link href={`/t/${n.threadId}`} onClick={close} className="flex gap-2.5 px-3 py-2.5 hover:bg-bg">
                    <Avatar username={n.actor} size="sm" className="mt-0.5" />
                    <span className="min-w-0 flex-1 text-xs leading-5">
                      <span className="font-medium">{n.actor}</span> commented on your thread{" "}
                      <span className="font-medium">“{n.threadTitle}”</span>
                      <time dateTime={n.createdAt} className="block text-muted" suppressHydrationWarning>
                        {timeAgo(n.createdAt)}
                      </time>
                    </span>
                    {!n.isRead && <span aria-label="Unread" className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-600" />}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {panel === "account" && (
        <div className={cx(panelClass, "w-[min(15rem,calc(100vw-2rem))]")}>
          <div className="border-b border-line px-3 py-2.5">
            <p className="truncate text-sm font-semibold">{member.profile.username}</p>
            <p className="truncate text-xs text-muted">
              {ROLE_LABEL[member.profile.role]} · {member.email}
            </p>
          </div>
          <nav className="py-1">
            <Link href="/my-posts" onClick={close} className={itemClass}>
              <FileText size={15} className="text-muted" /> My posts
            </Link>
            <Link href="/saved" onClick={close} className={itemClass}>
              <Bookmark size={15} className="text-muted" /> Saved
            </Link>
            <Link href="/profile" onClick={close} className={itemClass}>
              <UserRound size={15} className="text-muted" /> Profile
            </Link>
          </nav>
          <div className="border-t border-line py-1">
            <button
              type="button"
              onClick={() => {
                close();
                signOut();
              }}
              className={itemClass}
            >
              <LogOut size={15} className="text-muted" /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

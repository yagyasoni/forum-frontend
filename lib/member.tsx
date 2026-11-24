"use client";

// Member state and actions, backed by the forum-backend API.
// Every action follows the same pattern: change the shared copy in lib/live.ts first so the
// screen updates at once, send ONE request, then keep the server's answer or undo on failure.
// Nothing here reloads a page or refetches a list after an action.

import { useEffect, type ReactNode } from "react";
import {
  getMe,
  getMeNotifications,
  getMePosts,
  getMeSaved,
  likeComment,
  postComment,
  postThread,
  putProfile,
  putSave,
  signOut as apiSignOut,
} from "./api";
import {
  NO_COMMENTS,
  NO_THREADS,
  addedComments,
  createStore,
  createdThreads,
  likes,
  memberVotes,
  myThreads,
  notifications,
  resetMemberData,
  savedThreads,
  useStore,
  type LikeState,
  type NotificationItem,
} from "./live";
import type { Comment, Role, ThreadRow } from "./types";
import { textToHtml } from "./utils";
import { clearLocalVotes, type VoteValue } from "./votes";

export type Profile = { username: string; role: Role; favoriteCategoryIds: string[] };
export type Member = { email: string; verified: boolean; profile: Profile };
export type Notification = NotificationItem;

// ---- session ---------------------------------------------------------------------------------

const session = createStore<{ member: Member | null; loading: boolean }>({ member: null, loading: true });

/** Ask the server who is signed in. Called once on page load and again after a sign-in. */
async function loadMember() {
  let member: Member | null = null;
  let unread = 0;
  let votes: Record<string, VoteValue> | null = null;
  try {
    const raw = await getMe();
    if (raw?.profile) {
      member = {
        email: raw.email,
        verified: raw.verified,
        profile: {
          username: raw.profile.username,
          role: raw.profile.role as Role,
          favoriteCategoryIds: raw.profile.favoriteCategoryIds ?? [],
        },
      };
      unread = raw.unread ?? 0;
      votes = raw.votes ?? null;
    }
  } catch {
    // not reachable or not signed in: treat as a visitor
  }
  if (session.get().member?.email !== member?.email) resetMemberData(); // a different person
  notifications.update((n) => ({ ...n, unread }));
  if (votes) {
    // The server knows this member's votes (votes cast before signing in were moved to the
    // account at sign-in), so the arrows follow the account and the device copy is retired.
    memberVotes.set(votes);
    clearLocalVotes();
  }
  session.set({ member, loading: false });
}

/** Wraps the app once in layout.tsx and loads the session. */
export function MemberProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    loadMember();
  }, []);
  return <>{children}</>;
}

/** The signed-in member, or null for a visitor. */
export function useMember(): Member | null {
  return useStore(session, (s) => s.member, null);
}

/** True until the first session check has answered. */
export function useMemberLoading(): boolean {
  return useStore(session, (s) => s.loading, true);
}

/** Returns a function that re-reads the session. Call it after a successful sign-in. */
export function useMemberRefresh(): () => void {
  return loadMember;
}

/** No longer used directly — sign-in now goes through the API. Kept for compatibility. */
export function signIn(_email: string, _profile: Profile): void {
  void _email;
  void _profile;
}

/** No longer used — returning member profiles come from GET /api/me. */
export function findProfile(_email: string): Profile | null {
  void _email;
  return null;
}

/** Sign out the current member. */
export async function signOut(): Promise<void> {
  await apiSignOut();
  resetMemberData();
  clearLocalVotes(); // the arrows shown were this member's votes
  session.set({ member: null, loading: false });
}

// ---- saved threads ---------------------------------------------------------------------------

let savedRequest: Promise<void> | null = null;

function loadSaved() {
  if (savedThreads.get() !== null || savedRequest) return;
  savedRequest = getMeSaved()
    .then((list) => savedThreads.set(list))
    .catch(() => savedThreads.set([]))
    .finally(() => {
      savedRequest = null;
    });
}

/** The member's saved threads. Loaded once, then kept current by toggleSaved. */
export function useSaved(): ThreadRow[] {
  const member = useMember();
  const list = useStore(savedThreads, (v) => v, null);
  useEffect(() => {
    if (member) loadSaved();
  }, [member]);
  return member && list ? list : NO_THREADS;
}

/** Save or unsave a thread. The button and the Saved page change at once. */
export function toggleSaved(thread: ThreadRow, isSaved: boolean): void {
  const before = savedThreads.get();
  const list = before ?? [];
  savedThreads.set(isSaved ? list.filter((t) => t.id !== thread.id) : [thread, ...list.filter((t) => t.id !== thread.id)]);
  putSave(thread.id, !isSaved).catch(() => savedThreads.set(before)); // the server refused: put it back
}

// ---- posts -----------------------------------------------------------------------------------

let postsRequest: Promise<void> | null = null;

function loadPosts() {
  if (myThreads.get() !== null || postsRequest) return;
  postsRequest = getMePosts()
    .then((list) => {
      // Keep anything posted while the list was loading.
      const known = new Set(list.map((t) => t.id));
      myThreads.set([...createdThreads.get().filter((t) => !known.has(t.id)), ...list]);
    })
    .catch(() => myThreads.set(createdThreads.get()))
    .finally(() => {
      postsRequest = null;
    });
}

/** The member's own threads. Loaded once, then kept current by createPost. */
export function usePosts(): ThreadRow[] {
  const member = useMember();
  const list = useStore(myThreads, (v) => v, null);
  useEffect(() => {
    if (member) loadPosts();
  }, [member]);
  return member && list ? list : NO_THREADS;
}

/** Threads posted during this session, newest first. Home shows them until its list includes them. */
export function useCreatedPosts(): ThreadRow[] {
  return useStore(createdThreads, (v) => v, NO_THREADS);
}

/** Prototype-only: threads posted in this browser only. Now always returns null — the real
 * thread page loads from the server after createPost redirects. */
export function usePrototypeThread(_id: string) {
  void _id;
  return null;
}

/** Create a thread. Returns its id; My posts and Home show it without another request. */
export async function createPost(input: {
  category: { slug: string; name: string };
  title: string;
  body: string;
  imageUrl?: string;
}): Promise<string | null> {
  const member = session.get().member;
  const text = input.body.trim();
  const result = await postThread(input.category.slug, input.title, textToHtml(input.body), input.imageUrl);
  if (!result?.id) return null;

  if (member) {
    const now = new Date().toISOString();
    const row: ThreadRow = {
      id: result.id,
      title: input.title.trim(),
      excerpt: text.replace(/\s+/g, " ").slice(0, 180),
      imageUrl: input.imageUrl,
      category: input.category,
      author: { username: member.profile.username, role: member.profile.role, verified: member.verified },
      isPinned: false,
      isLocked: false,
      viewCount: 0,
      commentCount: 0,
      likeCount: 0,
      createdAt: now,
      lastActivityAt: now,
    };
    createdThreads.update((list) => [row, ...list]);
    myThreads.update((list) => (list ? [row, ...list] : list));
  }
  return result.id;
}

// ---- comments --------------------------------------------------------------------------------

/** Comments this member added to a thread during this session. Merge them with the server's list. */
export function useAddedComments(threadId: string): Comment[] {
  return useStore(addedComments, (all) => all[threadId] ?? NO_COMMENTS, NO_COMMENTS);
}

/** Local comments are no longer needed — the server returns all comments. */
export function useLocalComments(_threadId: string): Comment[] {
  void _threadId;
  return NO_COMMENTS;
}

/**
 * Add a comment. It appears at once on every screen showing this thread; when the server answers
 * it takes its real id, and if the server refuses it is removed again and the error is thrown so
 * the form can give the text back.
 */
export async function addComment(threadId: string, text: string): Promise<void> {
  const member = session.get().member;
  if (!member) throw new Error("Sign in required");
  const trimmed = text.trim();
  const pending: Comment = {
    id: `pending-${Date.now()}`,
    author: { username: member.profile.username, role: member.profile.role, verified: member.verified },
    body: textToHtml(trimmed),
    likeCount: 0,
    createdAt: new Date().toISOString(),
  };
  const put = (change: (list: Comment[]) => Comment[]) =>
    addedComments.update((all) => ({ ...all, [threadId]: change(all[threadId] ?? []) }));

  put((list) => [...list, pending]);
  try {
    const saved = await postComment(threadId, pending.body);
    put((list) => list.map((c) => (c === pending ? { ...pending, id: saved.id, createdAt: saved.createdAt } : c)));
  } catch (err) {
    put((list) => list.filter((c) => c !== pending));
    throw err;
  }
}

// ---- comment likes ---------------------------------------------------------------------------

/** A comment's like state: what this member changed here, or else what the server sent. */
export function useLike(comment: Comment): LikeState {
  const changed = useStore(likes, (all) => all[comment.id], undefined);
  return changed ?? { liked: !!comment.likedByMe, count: comment.likeCount };
}

/** Like or unlike a comment. One request; the count shown is the server's. */
export async function toggleLike(threadId: string, commentId: string, current: LikeState): Promise<void> {
  const set = (state: LikeState) => likes.update((all) => ({ ...all, [commentId]: state }));
  set({ liked: !current.liked, count: Math.max(0, current.count + (current.liked ? -1 : 1)) });
  try {
    const { likeCount } = await likeComment(threadId, commentId);
    // The endpoint toggles, so the direction the count moved says which state the server is in.
    set({ liked: likeCount > current.count ? true : likeCount < current.count ? false : !current.liked, count: likeCount });
  } catch {
    set(current);
  }
}

// ---- notifications ---------------------------------------------------------------------------

let notificationsRequest: Promise<void> | null = null;

/** The bell: unread count and the list (null until the bell has been opened). */
export function useNotifications(): { unread: number; items: Notification[] | null } {
  const member = useMember();
  const state = useStore(notifications, (v) => v, NO_NOTIFICATIONS);
  return member ? state : NO_NOTIFICATIONS;
}

const NO_NOTIFICATIONS: { unread: number; items: Notification[] | null } = { unread: 0, items: null };

/** Load the list when the bell is opened. The server marks them read as part of this request. */
export function openNotifications(): void {
  const { items, unread } = notifications.get();
  if (notificationsRequest || (items !== null && unread === 0)) return;
  notificationsRequest = getMeNotifications()
    .then((list) =>
      notifications.update((n) => ({ ...n, items: list.map((item) => ({ ...item, actor: item.actor.username })) })),
    )
    .catch(() => notifications.update((n) => ({ ...n, items: n.items ?? [] })))
    .finally(() => {
      notificationsRequest = null;
    });
}

/** Called when the bell closes: everything in it has now been seen. */
export function markNotificationsRead(): void {
  const n = notifications.get();
  if (n.unread === 0 && !n.items?.some((i) => !i.isRead)) return;
  notifications.set({ unread: 0, items: n.items?.map((i) => ({ ...i, isRead: true })) ?? null });
}

// ---- profile ---------------------------------------------------------------------------------

/** Save the profile. The top bar and sidebar pick up the new name and favorites at once. */
export async function updateProfile(profile: Profile): Promise<void> {
  await putProfile(profile.username, profile.role, profile.favoriteCategoryIds);
  const { member } = session.get();
  if (member) session.set({ member: { ...member, profile }, loading: false });
}

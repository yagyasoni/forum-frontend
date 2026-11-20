// Member prototype state. Everything a signed-in member does (sign in, profile, posts, comments,
// saves, notifications) is kept in this browser only, so the screens can be reviewed before the
// member backend exists. Each function here maps to one future API call, named in its comment.

import { useSyncExternalStore } from "react";
import { DEMO_REPLIER, DEMO_REPLY, MEMBER_THREADS } from "./member-mock";
import type { Comment, Role, ThreadDetail, ThreadRow } from "./types";

export type Profile = { username: string; role: Role; favoriteCategorySlugs: string[] };
export type Member = { email: string; verified: boolean; profile: Profile };

export type Notification = {
  id: string;
  threadId: string;
  threadTitle: string;
  actor: string; // username of the person who commented
  isRead: boolean;
  createdAt: string;
};

type LocalThread = ThreadDetail & { demoReplied?: boolean };

/** A value in localStorage that components can subscribe to. */
function createStore<T>(key: string, fallback: T) {
  const event = `${key}-change`;
  let raw: string | null | undefined; // last string read, so the parsed value keeps its identity
  let value = fallback;

  function get(): T {
    let next: string | null = null;
    try {
      next = window.localStorage.getItem(key);
    } catch {
      // storage blocked: behave as empty
    }
    if (next !== raw) {
      raw = next;
      try {
        value = next ? (JSON.parse(next) as T) : fallback;
      } catch {
        value = fallback;
      }
    }
    return value;
  }

  function set(next: T) {
    try {
      window.localStorage.setItem(key, JSON.stringify(next));
    } catch {
      // storage full or blocked: the change is lost on reload, fine for a prototype
    }
    window.dispatchEvent(new Event(event));
  }

  function subscribe(onChange: () => void) {
    window.addEventListener(event, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(event, onChange);
      window.removeEventListener("storage", onChange);
    };
  }

  return { get, set, subscribe, fallback };
}

type Store<T> = ReturnType<typeof createStore<T>>;

/** Read a store in a component. The server render and first paint use the empty value. */
function useStore<T>(store: Store<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, () => store.fallback);
}

const EMPTY_LIST: never[] = [];
const EMPTY_MAP = {};

const session = createStore<Member | null>("forum_member", null);
const profiles = createStore<Record<string, Profile>>("forum_member_profiles", EMPTY_MAP); // by email
const saved = createStore<ThreadRow[]>("forum_member_saved", EMPTY_LIST);
const posts = createStore<LocalThread[]>("forum_member_posts", EMPTY_LIST);
const comments = createStore<Record<string, Comment[]>>("forum_member_comments", EMPTY_MAP); // by thread id
const notifications = createStore<Notification[]>("forum_member_notifications", EMPTY_LIST);

const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

// ---- Session ---------------------------------------------------------------------------------

/** The signed-in member, or null for a visitor. Future: GET /api/me. */
export const useMember = () => useStore(session);

/** The profile saved earlier for this email, if this person has signed in before. */
export function findProfile(email: string): Profile | null {
  return profiles.get()[email.toLowerCase()] ?? null;
}

/** Future: POST /api/auth/google or /api/auth/login, then PUT /api/me/profile on first sign-in. */
export function signIn(email: string, profile: Profile) {
  const key = email.toLowerCase();
  profiles.set({ ...profiles.get(), [key]: profile });
  // "Verified Pharmacy" comes from the AuditProRx account having a pharmacy on file. The prototype
  // shows it for owners so both looks can be reviewed.
  session.set({ email: key, verified: profile.role === "owner", profile });
  document.documentElement.dataset.member = "1";
}

/** Future: PUT /api/me/profile. */
export function updateProfile(profile: Profile) {
  const member = session.get();
  if (member) signIn(member.email, profile);
}

/** Future: POST /api/auth/logout. */
export function signOut() {
  session.set(null);
  delete document.documentElement.dataset.member;
}

// ---- Saved threads ---------------------------------------------------------------------------

/** Future: GET /api/me/saved. */
export const useSaved = () => useStore(saved);

/** Future: PUT /api/threads/:id/save. */
export function toggleSaved(thread: ThreadRow) {
  const list = saved.get();
  saved.set(list.some((t) => t.id === thread.id) ? list.filter((t) => t.id !== thread.id) : [thread, ...list]);
}

// ---- Threads posted by the member ------------------------------------------------------------

/** Future: GET /api/me/threads. */
export const usePosts = (): ThreadDetail[] => useStore(posts);

/** A prototype thread by id: one of the sample member threads or one posted in this browser. */
export function usePrototypeThread(id: string): ThreadDetail | null {
  const own = useStore(posts);
  return own.find((p) => p.thread.id === id) ?? MEMBER_THREADS.find((p) => p.thread.id === id) ?? null;
}

/** Future: POST /api/threads. Returns the new thread's id. */
export function createPost(input: {
  category: { slug: string; name: string };
  title: string;
  body: string; // plain text from the form
  imageUrl?: string;
}): string | null {
  const member = session.get();
  if (!member) return null;
  const now = new Date().toISOString();
  const text = input.body.trim();
  const post: LocalThread = {
    thread: {
      id: uid("local"),
      title: input.title.trim(),
      excerpt: text.replace(/\s+/g, " ").slice(0, 180),
      body: toHtml(text),
      imageUrl: input.imageUrl,
      category: input.category,
      author: authorOf(member),
      isPinned: false,
      isLocked: false,
      viewCount: 1,
      commentCount: 0,
      likeCount: 0,
      createdAt: now,
      lastActivityAt: now,
    },
    comments: [],
  };
  posts.set([post, ...posts.get()]);
  return post.thread.id;
}

// ---- Comments --------------------------------------------------------------------------------

/** Comments this member added to a thread, in this browser. They are shown after the real ones. */
export function useLocalComments(threadId: string): Comment[] {
  return useStore(comments)[threadId] ?? EMPTY_LIST;
}

/** Future: POST /api/threads/:id/comments. */
export function addComment(threadId: string, text: string) {
  const member = session.get();
  if (!member || !text.trim()) return;
  appendComment(threadId, {
    id: uid("lc"),
    author: authorOf(member),
    body: toHtml(text.trim()),
    likeCount: 0,
    createdAt: new Date().toISOString(),
  });
}

function appendComment(threadId: string, comment: Comment) {
  const all = comments.get();
  comments.set({ ...all, [threadId]: [...(all[threadId] ?? []), comment] });
}

// ---- Notifications ---------------------------------------------------------------------------

/** Future: GET /api/me/notifications (one type: someone commented on your thread). */
export const useNotifications = () => useStore(notifications);

/** Future: the same GET marks them read. */
export function markNotificationsRead() {
  const list = notifications.get();
  if (list.some((n) => !n.isRead)) notifications.set(list.map((n) => ({ ...n, isRead: true })));
}

/** How long after posting the sample reply arrives. */
export const DEMO_REPLY_DELAY_MS = 8000;

/**
 * Prototype only: a sample member replies to a thread you posted, which raises a notification.
 * With the backend this happens when a real member comments.
 */
export function addDemoReply(threadId: string) {
  const list = posts.get();
  const post = list.find((p) => p.thread.id === threadId);
  if (!post || post.demoReplied) return;
  const now = new Date().toISOString();
  posts.set(list.map((p) => (p === post ? { ...p, demoReplied: true } : p)));
  appendComment(threadId, { id: uid("lc"), author: DEMO_REPLIER, body: DEMO_REPLY, likeCount: 0, createdAt: now });
  notifications.set([
    { id: uid("n"), threadId, threadTitle: post.thread.title, actor: DEMO_REPLIER.username, isRead: false, createdAt: now },
    ...notifications.get(),
  ]);
}

/** Threads still waiting for their sample reply, with the time each was posted. */
export function pendingDemoReplies(): Array<{ id: string; createdAt: string }> {
  return posts
    .get()
    .filter((p) => !p.demoReplied)
    .map((p) => ({ id: p.thread.id, createdAt: p.thread.createdAt }));
}

// ---- Helpers ---------------------------------------------------------------------------------

function authorOf(member: Member) {
  return { username: member.profile.username, role: member.profile.role, verified: member.verified };
}

/** Plain text from a textarea to the simple HTML the thread pages render. */
function toHtml(text: string) {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

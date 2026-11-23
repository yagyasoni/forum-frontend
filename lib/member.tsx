"use client";

// Member state. Backed by the forum-backend API.
// Exports keep the same signatures as the localStorage prototype so components need no changes.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  getMe,
  getMeNotifications,
  getMePosts,
  getMeSaved,
  postComment,
  postThread,
  putProfile,
  putSave,
  signOut as apiSignOut,
  type ApiNotification,
} from "./api";
import type { Comment, Role, ThreadRow } from "./types";

export type Profile = { username: string; role: Role; favoriteCategorySlugs: string[] };
export type Member = { email: string; verified: boolean; profile: Profile };

export type Notification = {
  id: string;
  threadId: string;
  threadTitle: string;
  actor: string;
  isRead: boolean;
  createdAt: string;
};

// ---- context ---------------------------------------------------------------

type MemberContextValue = {
  member: Member | null;
  loading: boolean;
  refresh: () => void;
};

const MemberContext = createContext<MemberContextValue>({
  member: null,
  loading: true,
  refresh: () => {},
});

function mapToMember(raw: Awaited<ReturnType<typeof getMe>>): Member | null {
  if (!raw?.profile) return null;
  return {
    email: raw.email,
    verified: raw.verified,
    profile: {
      username: raw.profile.username,
      role: raw.profile.role as Role,
      favoriteCategorySlugs: raw.profile.favoriteCategoryIds,
    },
  };
}

export function MemberProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getMe()
      .then((raw) => {
        if (!alive) return;
        setMember(mapToMember(raw));
      })
      .catch(() => {
        if (alive) setMember(null);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [tick]);

  const refresh = useCallback(() => setTick((n) => n + 1), []);

  // Listen for signOut() calls (which can't use a hook).
  useEffect(() => {
    const handler = () => { setMember(null); setLoading(false); };
    window.addEventListener("forum-signout", handler);
    return () => window.removeEventListener("forum-signout", handler);
  }, []);

  return (
    <MemberContext.Provider value={{ member, loading, refresh }}>
      {children}
    </MemberContext.Provider>
  );
}

// ---- session hooks & actions ------------------------------------------------

export function useMember(): Member | null {
  return useContext(MemberContext).member;
}

export function useMemberRefresh(): () => void {
  return useContext(MemberContext).refresh;
}

/** No longer used directly — sign-in now goes through the API. Kept for compatibility. */
export function signIn(_email: string, _profile: Profile): void {
  // no-op; real sign-in calls signInEmail/signInGoogle then refresh()
}

/** No longer used — returning member profiles come from GET /api/me. */
export function findProfile(_email: string): Profile | null {
  return null;
}

/** Sign out the current member. */
export async function signOut(): Promise<void> {
  await apiSignOut();
  // Trigger a full context refresh so member becomes null.
  // Components that need this call useMemberRefresh() after signOut().
  // AccountMenu uses the imported signOut directly; we dispatch a custom event
  // so the provider can react without a hook inside this function.
  window.dispatchEvent(new Event("forum-signout"));
}

// ---- saved threads ---------------------------------------------------------

export function useSaved(): ThreadRow[] {
  const { member } = useContext(MemberContext);
  const [saved, setSaved] = useState<ThreadRow[]>([]);

  useEffect(() => {
    if (!member) { setSaved([]); return; }
    getMeSaved().then(setSaved).catch(() => setSaved([]));
  }, [member]);

  return saved;
}

export function toggleSaved(thread: ThreadRow, isSaved: boolean): void {
  putSave(thread.id, !isSaved).catch(() => {});
}

// ---- posts -----------------------------------------------------------------

export function usePosts(): ThreadRow[] {
  const { member } = useContext(MemberContext);
  const [posts, setPosts] = useState<ThreadRow[]>([]);

  useEffect(() => {
    if (!member) { setPosts([]); return; }
    getMePosts().then(setPosts).catch(() => setPosts([]));
  }, [member]);

  return posts;
}

/** Prototype-only: threads posted in this browser only. Now always returns null — the real
 * thread page loads from the server after createPost redirects. */
export function usePrototypeThread(_id: string) {
  return null;
}

export async function createPost(input: {
  category: { slug: string; name: string };
  title: string;
  body: string;
  imageUrl?: string;
}): Promise<string | null> {
  try {
    const result = await postThread(input.category.slug, input.title, toHtml(input.body), input.imageUrl);
    return result.id;
  } catch (err) {
    throw err;
  }
}

// ---- comments --------------------------------------------------------------

/** Local comments are no longer needed — the server returns all comments. */
export function useLocalComments(_threadId: string): Comment[] {
  return [];
}

export async function addComment(threadId: string, text: string): Promise<void> {
  await postComment(threadId, toHtml(text.trim()));
}

// ---- notifications ---------------------------------------------------------

export function useNotifications(): Notification[] {
  const { member } = useContext(MemberContext);
  const [notes, setNotes] = useState<Notification[]>([]);

  useEffect(() => {
    if (!member) { setNotes([]); return; }
    getMeNotifications()
      .then((items: ApiNotification[]) =>
        setNotes(items.map((n) => ({ ...n, actor: n.actor.username })))
      )
      .catch(() => setNotes([]));
  }, [member]);

  return notes;
}

/** No-op: the backend marks notifications read when GET /api/me/notifications is called. */
export function markNotificationsRead(): void {}

// ---- profile ---------------------------------------------------------------

export async function updateProfile(profile: Profile): Promise<void> {
  await putProfile(profile.username, profile.role, profile.favoriteCategorySlugs);
}

// ---- demo stubs (AccountMenu uses these; safe to leave as no-ops) ----------

export const DEMO_REPLY_DELAY_MS = 8000;
export function addDemoReply(_threadId: string): void {}
export function pendingDemoReplies(): Array<{ id: string; createdAt: string }> { return []; }

// ---- helpers ---------------------------------------------------------------

function toHtml(text: string): string {
  const escape = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return text
    .split(/\n{2,}/)
    .map((p) => `<p>${escape(p).replace(/\n/g, "<br>")}</p>`)
    .join("");
}

// One shared, in-memory copy of everything a member can change: scores, comments they added,
// comment likes, saved threads, their posts, notifications. Every screen reads from here, so a
// change made in one place shows everywhere at once and nothing has to be reloaded from the server.
// It lives for the page session only; a full reload starts again from the server's values.

import { useSyncExternalStore } from "react";
import type { Comment, ThreadRow } from "./types";
import type { VoteValue } from "./votes";

type Listener = () => void;

export type Store<T> = {
  get: () => T;
  set: (next: T) => void;
  update: (change: (current: T) => T) => void;
  subscribe: (listener: Listener) => () => void;
};

export function createStore<T>(initial: T): Store<T> {
  let value = initial;
  const listeners = new Set<Listener>();
  const set = (next: T) => {
    value = next;
    listeners.forEach((l) => l());
  };
  return {
    get: () => value,
    set,
    update: (change) => set(change(value)),
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/**
 * Read part of a store in a component. `select` must return the stored value itself (not a new
 * object), so React can tell when nothing changed. `onServer` is used for the server render.
 */
export function useStore<T, S>(store: Store<T>, select: (value: T) => S, onServer: S): S {
  return useSyncExternalStore(
    store.subscribe,
    () => select(store.get()),
    () => onServer,
  );
}

export type LikeState = { liked: boolean; count: number };

export type NotificationItem = {
  id: string;
  threadId: string;
  threadTitle: string;
  actor: string; // username of the person who commented
  isRead: boolean;
  createdAt: string;
};

/** Thread id -> current score, set whenever this browser votes. */
export const scores = createStore<Record<string, number>>({});

/**
 * Thread id -> the signed-in member's vote, as the server has it. null while nobody is signed in
 * (or the server did not send them); visitors' votes live in device storage instead (lib/votes.ts).
 */
export const memberVotes = createStore<Record<string, VoteValue> | null>(null);

/** Thread id -> comments this member added during this session (the newest state the server has). */
export const addedComments = createStore<Record<string, Comment[]>>({});

/** Comment id -> like state, set whenever this member likes or unlikes. */
export const likes = createStore<Record<string, LikeState>>({});

/** The member's saved threads. null until loaded, which happens once per sign-in. */
export const savedThreads = createStore<ThreadRow[] | null>(null);

/** The member's own threads. null until loaded, which happens once per sign-in. */
export const myThreads = createStore<ThreadRow[] | null>(null);

/** Threads posted during this session, so they can show on Home without reloading the list. */
export const createdThreads = createStore<ThreadRow[]>([]);

/** Bell: the unread count comes with the session; the list is loaded when the bell is opened. */
export const notifications = createStore<{ unread: number; items: NotificationItem[] | null }>({
  unread: 0,
  items: null,
});

/** Forget everything that belongs to a member. Called on sign-in, sign-out, and account change. */
export function resetMemberData() {
  memberVotes.set(null);
  addedComments.set({});
  likes.set({});
  savedThreads.set(null);
  myThreads.set(null);
  createdThreads.set([]);
  notifications.set({ unread: 0, items: null });
}

export const NO_COMMENTS: Comment[] = [];
export const NO_THREADS: ThreadRow[] = [];

/** Server comments plus the ones added here, without showing any comment twice. */
export function mergeComments(fromServer: Comment[], added: Comment[]): Comment[] {
  if (added.length === 0) return fromServer;
  const known = new Set(fromServer.map((c) => c.id));
  return [...fromServer, ...added.filter((c) => !known.has(c.id))];
}

/**
 * How many of the added comments a thread row does not count yet. A row loaded before the
 * comment was posted has an older lastActivityAt; one loaded after already includes it.
 */
export function uncountedComments(row: Pick<ThreadRow, "lastActivityAt">, added: Comment[]): number {
  const seen = Date.parse(row.lastActivityAt);
  return added.filter((c) => c.id.startsWith("pending-") || Date.parse(c.createdAt) > seen).length;
}

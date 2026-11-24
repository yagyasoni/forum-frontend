// The only place the app talks to forum-backend.
// While the backend is not running, set NEXT_PUBLIC_USE_MOCK=true and the
// same functions answer from lib/mock.ts with no other code changes.

import type {
  Category,
  Comment,
  LookupInput,
  LookupMatch,
  ThreadDetail,
  ThreadPage,
  ThreadQuery,
  ThreadRow,
} from "./types";
import * as mock from "./mock";
import type { VoteValue } from "./votes";
import { cache } from "react";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true" || !BASE;

// ---- authenticated helpers (client-side only) ------------------------------

async function authedGet<T>(path: string): Promise<T | null> {
  const url = new URL(`${BASE!.replace(/\/+$/, "")}${path}`);
  const res = await fetch(url, { cache: "no-store", credentials: "include" });
  if (res.status === 401 || res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

async function post<T>(path: string, body: unknown, extraHeaders?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE!.replace(/\/+$/, "")}${path}`);
  const res = await fetch(url, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error((err as { error?: string }).error ?? res.statusText), { status: res.status, data: err });
  }
  return res.json();
}

async function put<T>(path: string, body: unknown, extraHeaders?: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE!.replace(/\/+$/, "")}${path}`);
  const res = await fetch(url, {
    method: "PUT",
    credentials: "include",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw Object.assign(new Error((err as { error?: string }).error ?? res.statusText), { status: res.status, data: err });
  }
  return res.json();
}

async function get<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T | null> {
  // Concatenate rather than new URL(path, BASE): a leading-slash path would drop a base prefix like /forum.
  const url = new URL(`${BASE!.replace(/\/+$/, "")}${path}`);
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") url.searchParams.set(key, String(value));
  }
  const res = await fetch(url, { cache: "no-store" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${path}`);
  return res.json();
}

export async function getCategories(): Promise<Category[]> {
  if (USE_MOCK) return mock.categories();
  return (await get<Category[]>("/api/categories")) ?? [];
}

export async function getThreads(query: ThreadQuery): Promise<ThreadPage> {
  if (USE_MOCK) return mock.threads(query);
  const path = query.q ? "/api/search" : "/api/threads";
  const page = await get<ThreadPage>(path, {
    tab: query.tab,
    category: query.category,
    q: query.q,
    page: query.page,
  });
  return page ?? { items: [], page: query.page, pageSize: 8, total: 0, hasMore: false };
}

// cache() dedupes the call within one request, so generateMetadata and the page
// share a single fetch and the backend counts one view, not two.
export const getThread = cache(async (id: string): Promise<ThreadDetail | null> => {
  if (USE_MOCK) return mock.thread(id);

  // Forward the forum_session cookie so the backend knows who is requesting
  // (needed for likedByMe, savedByMe etc.). cookies() is only available server-side.
  let cookieHeader: string | undefined;
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const store = await cookies();
      const session = store.get("forum_session");
      if (session) cookieHeader = `forum_session=${session.value}`;
    } catch { /* not in a request context */ }
  }

  const url = new URL(`${BASE!.replace(/\/+$/, "")}/api/threads/${id}`);
  const res = await fetch(url, {
    cache: "no-store",
    headers: cookieHeader ? { Cookie: cookieHeader } : {},
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for /api/threads/${id}`);
  return res.json();
});

/** Comments only, for expanding them on a card. Unlike getThread this does not count a view. */
export async function getComments(threadId: string): Promise<Comment[]> {
  if (USE_MOCK) return mock.thread(threadId)?.comments ?? [];
  const data = await get<{ items: Comment[] }>(`/api/threads/${threadId}/comments`);
  return data?.items ?? [];
}

/**
 * Records this browser's vote on a thread (1 up, -1 down, 0 to remove) and returns the new score.
 * The server keeps one vote per browser per thread, so repeating a vote never counts twice.
 */
export async function voteThread(threadId: string, value: VoteValue): Promise<{ score: number; myVote: VoteValue }> {
  const { getVoterId, getLocalVote, setLocalVote } = await import("./votes");
  if (USE_MOCK) {
    const current = mock.thread(threadId)?.thread.likeCount ?? 0;
    setLocalVote(threadId, value);
    return { score: current + value, myVote: value };
  }
  const res = await fetch(`${BASE!.replace(/\/+$/, "")}/api/threads/${threadId}/vote`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", "X-Forum-Voter": getVoterId() },
    body: JSON.stringify({ value }),
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for vote`);
  const data = (await res.json()) as { score: number; myVote: VoteValue };
  setLocalVote(threadId, data.myVote ?? getLocalVote(threadId));
  return data;
}

// ---- auth ------------------------------------------------------------------

export type MeProfile = { username: string; role: string; favoriteCategoryIds: string[] };
export type MeResponse = { id: string; email: string; verified: boolean; unread: number; profile: MeProfile | null };

export async function getMe(): Promise<MeResponse | null> {
  if (USE_MOCK) {
    return { id: "mock", email: "mock@example.com", verified: true, unread: 0, profile: { username: "mock_user", role: "pharmacist", favoriteCategoryIds: [] } };
  }
  return authedGet<MeResponse>("/api/me");
}

export async function signInEmail(email: string, password: string): Promise<{ id: string; hasProfile: boolean }> {
  if (USE_MOCK) return { id: "mock", hasProfile: true };
  const data = await post<{ user: { id: string; hasProfile: boolean } }>("/api/auth/login", { email, password });
  return data.user;
}

export async function signInGoogle(idToken: string): Promise<{ id: string; hasProfile: boolean }> {
  if (USE_MOCK) return { id: "mock", hasProfile: true };
  const data = await post<{ user: { id: string; hasProfile: boolean } }>("/api/auth/google", { idToken });
  return data.user;
}

export async function signOut(): Promise<void> {
  if (USE_MOCK) return;
  await fetch(new URL(`${BASE!.replace(/\/+$/, "")}/api/auth/logout`), { method: "POST", credentials: "include" });
}

export async function putProfile(username: string, role: string, favoriteCategoryIds: string[]): Promise<void> {
  if (USE_MOCK) return;
  await put("/api/me/profile", { username, role, favoriteCategoryIds });
}

export async function likeComment(threadId: string, commentId: string): Promise<{ likeCount: number }> {
  if (USE_MOCK) return { likeCount: 0 };
  const data = await put<{ likeCount: number }>(`/api/threads/${threadId}/comments/${commentId}/like`, {});
  return data ?? { likeCount: 0 };
}

export async function putSave(threadId: string, saved: boolean): Promise<void> {
  if (USE_MOCK) return;
  await put(`/api/threads/${threadId}/save`, { saved });
}

export async function getMeSaved(): Promise<ThreadRow[]> {
  if (USE_MOCK) return [];
  const data = await authedGet<{ items: ThreadRow[] }>("/api/me/saved");
  return data?.items ?? [];
}

export async function getMePosts(): Promise<ThreadRow[]> {
  if (USE_MOCK) return [];
  const data = await authedGet<{ items: ThreadRow[] }>("/api/me/threads");
  return data?.items ?? [];
}

export type ApiNotification = { id: string; threadId: string; threadTitle: string; actor: { username: string }; isRead: boolean; createdAt: string };

export async function getMeNotifications(): Promise<ApiNotification[]> {
  if (USE_MOCK) return [];
  const data = await authedGet<{ items: ApiNotification[] }>("/api/me/notifications");
  return data?.items ?? [];
}

export async function postThread(
  categorySlug: string,
  title: string,
  body: string,
  imageUrl?: string,
): Promise<{ id: string }> {
  if (USE_MOCK) return { id: `mock-${Date.now()}` };
  return post<{ id: string }>("/api/threads", { categorySlug, title, body, imageUrl });
}

/** Upload an image file and return its public URL. */
export async function uploadImage(file: File): Promise<string> {
  if (USE_MOCK) return URL.createObjectURL(file);

  // Concatenate, as everywhere else in this file: a leading-slash path would drop the /forum prefix.
  const url = new URL(`${BASE!.replace(/\/+$/, "")}/api/upload/image`);
  const form = new FormData();
  form.append("image", file);

  const res = await fetch(url, { method: "POST", credentials: "include", body: form });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "Image upload failed.");
  }
  const data = await res.json() as { url: string };
  return data.url;
}

export async function postComment(threadId: string, body: string): Promise<{ id: string; createdAt: string }> {
  if (USE_MOCK) return { id: `mock-c-${Date.now()}`, createdAt: new Date().toISOString() };
  return post<{ id: string; createdAt: string }>(`/api/threads/${threadId}/comments`, { body });
}

// The payer lookup is served by the main AuditProRx API, which already has the BIN search
// used by the app's own BIN Search page. It needs a BIN; PCN and Group narrow the match.
// It answers with distinct { pbm_name, payer_type } pairs, which we map to the forum's shape.
const AUDIT_BASE = process.env.NEXT_PUBLIC_AUDIT_API_BASE_URL ?? "https://api.auditprorx.com";

export async function lookupPayer(input: LookupInput): Promise<LookupMatch[]> {
  if (USE_MOCK) return mock.lookup(input);
  const bin = input.bin?.trim() ?? "";
  const pcn = input.pcn?.trim() ?? "";
  const group = input.group?.trim() ?? "";
  if (!bin) return [];

  const url = new URL(`${AUDIT_BASE.replace(/\/+$/, "")}/api/bin-search`);
  url.searchParams.set("bin", bin);
  if (pcn) url.searchParams.set("pcn", pcn);
  if (group) url.searchParams.set("group", group);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for /api/bin-search`);
  const rows: Array<{ pbm_name: string; payer_type: string }> = await res.json();
  return rows.map((r) => ({
    bin,
    pcn: pcn.toUpperCase(),
    group: group.toUpperCase(),
    pbmName: r.pbm_name,
    payerType: r.payer_type,
  }));
}

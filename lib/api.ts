// The only place the app talks to forum-backend.
// While the backend is not running, set NEXT_PUBLIC_USE_MOCK=true and the
// same functions answer from lib/mock.ts with no other code changes.

import type {
  Category,
  LookupInput,
  LookupMatch,
  ThreadDetail,
  ThreadPage,
  ThreadQuery,
} from "./types";
import * as mock from "./mock";
import { cache } from "react";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true" || !BASE;

async function get<T>(
  path: string,
  params: Record<string, string | number | undefined> = {},
): Promise<T | null> {
  const url = new URL(path, BASE);
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
  return page ?? { items: [], page: query.page, pageSize: 20, total: 0, hasMore: false };
}

// cache() dedupes the call within one request, so generateMetadata and the page
// share a single fetch and the backend counts one view, not two.
export const getThread = cache(async (id: string): Promise<ThreadDetail | null> => {
  if (USE_MOCK) return mock.thread(id);
  return get<ThreadDetail>(`/api/threads/${id}`);
});

export async function lookupPayer(input: LookupInput): Promise<LookupMatch[]> {
  if (USE_MOCK) return mock.lookup(input);
  const data = await get<{ items: LookupMatch[] }>("/api/lookup", input);
  return data?.items ?? [];
}

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
} from "./types";
import * as mock from "./mock";
import { cache } from "react";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL;
const USE_MOCK = process.env.NEXT_PUBLIC_USE_MOCK === "true" || !BASE;

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
  return page ?? { items: [], page: query.page, pageSize: 20, total: 0, hasMore: false };
}

// cache() dedupes the call within one request, so generateMetadata and the page
// share a single fetch and the backend counts one view, not two.
export const getThread = cache(async (id: string): Promise<ThreadDetail | null> => {
  if (USE_MOCK) return mock.thread(id);
  return get<ThreadDetail>(`/api/threads/${id}`);
});

/** Comments only, for expanding them on a card. Unlike getThread this does not count a view. */
export async function getComments(threadId: string): Promise<Comment[]> {
  if (USE_MOCK) return mock.thread(threadId)?.comments ?? [];
  const data = await get<{ items: Comment[] }>(`/api/threads/${threadId}/comments`);
  return data?.items ?? [];
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

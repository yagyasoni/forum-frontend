import type { ThreadQuery } from "./types";

/** Join class names, skipping falsy values. */
export function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

/** "3m ago", "5h ago", "2d ago", or a short date for anything older than a month. */
export function timeAgo(iso: string) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = seconds / 60;
  if (minutes < 60) return `${Math.floor(minutes)}m ago`;
  const hours = minutes / 60;
  if (hours < 24) return `${Math.floor(hours)}h ago`;
  const days = hours / 24;
  if (days < 30) return `${Math.floor(days)}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** 1200 -> "1.2K" */
export function compact(n: number) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(n);
}

/** Build a Home URL from a query, leaving out defaults so links stay clean. */
export function homeHref(query: Partial<ThreadQuery>) {
  const params = new URLSearchParams();
  if (query.tab && query.tab !== "latest") params.set("tab", query.tab);
  if (query.category) params.set("category", query.category);
  if (query.q) params.set("q", query.q);
  if (query.page && query.page > 1) params.set("page", String(query.page));
  const qs = params.toString();
  return qs ? `/?${qs}` : "/";
}

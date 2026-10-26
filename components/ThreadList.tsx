import Link from "next/link";
import ThreadCard from "./ThreadCard";
import type { ThreadPage, ThreadQuery } from "@/lib/types";
import { cx, homeHref } from "@/lib/utils";

/** The threads for one page as separate cards, with the pagination bar under them. Pages live in the URL. */
export default function ThreadList({ page, query }: { page: ThreadPage; query: ThreadQuery }) {
  return (
    <div className="space-y-3">
      {page.items.map((thread) => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
      <Pagination page={page} query={query} />
    </div>
  );
}

/** Full-width bar: "Showing x–y of n" on the left, Previous / page numbers / Next on the right. */
function Pagination({ page, query }: { page: ThreadPage; query: ThreadQuery }) {
  const pageCount = Math.max(1, Math.ceil(page.total / page.pageSize));
  if (pageCount <= 1) return null;

  const first = (page.page - 1) * page.pageSize + 1;
  const last = Math.min(page.page * page.pageSize, page.total);
  const href = (n: number) => homeHref({ ...query, page: n });

  return (
    <nav aria-label="Pagination" className="flex items-center justify-between gap-3 rounded-md border border-line bg-surface px-3 py-2 shadow-xs">
      <p className="text-xs whitespace-nowrap text-muted tabular-nums">
        Showing {first}–{last} of {page.total}
        <span className="hidden sm:inline"> threads</span>
      </p>

      <div className="flex items-center gap-1">
        <PageLink href={href(page.page - 1)} disabled={page.page === 1} label="Previous" />
        {pageNumbers(page.page, pageCount).map((n, i) =>
          n === "…" ? (
            <span key={`gap-${i}`} className="w-7 text-center text-xs text-muted">
              …
            </span>
          ) : (
            <PageLink key={n} href={href(n)} label={String(n)} current={n === page.page} />
          ),
        )}
        <PageLink href={href(page.page + 1)} disabled={page.page === pageCount} label="Next" />
      </div>
    </nav>
  );
}

function PageLink({
  href,
  label,
  current,
  disabled,
}: {
  href: string;
  label: string;
  current?: boolean;
  disabled?: boolean;
}) {
  const base = "inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs font-medium tabular-nums";
  if (disabled) return <span className={cx(base, "text-muted opacity-50")}>{label}</span>;
  if (current) {
    return (
      <span aria-current="page" className={cx(base, "bg-fg text-bg")}>
        {label}
      </span>
    );
  }
  return (
    <Link href={href} className={cx(base, "text-muted transition-colors hover:bg-bg hover:text-fg")}>
      {label}
    </Link>
  );
}

/** 1 … 4 5 6 … 12: always the first, last, and the pages around the current one. */
function pageNumbers(current: number, total: number): Array<number | "…"> {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const wanted = [1, total, current - 1, current, current + 1].filter((n) => n >= 1 && n <= total);
  const sorted = [...new Set(wanted)].sort((a, b) => a - b);
  const out: Array<number | "…"> = [];
  let prev = 0;
  for (const n of sorted) {
    if (n - prev > 1) out.push("…");
    out.push(n);
    prev = n;
  }
  return out;
}

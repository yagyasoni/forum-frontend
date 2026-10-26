"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import type { Category, Tab, ThreadQuery } from "@/lib/types";
import { cx, homeHref } from "@/lib/utils";

const TABS: Array<{ value: Tab; label: string }> = [
  { value: "latest", label: "Latest" },
  { value: "top", label: "Top" },
  { value: "unanswered", label: "Unanswered" },
];

/**
 * Tabs plus a category dropdown. Both only change the URL; the page reloads the list.
 * The dropdown shows where the sidebar's category list is hidden.
 */
export default function FilterStrip({
  query,
  categories,
}: {
  query: ThreadQuery;
  categories: Category[];
}) {
  const router = useRouter();

  return (
    /* Below md: tabs and dropdown share one row as two identical columns whenever the row is at least
       340px wide, the point where half a row holds all three tab labels. Narrower than that they stack as
       two full-width rows. From md up only the tabs remain, at their natural width. */
    <div className="@container">
      <div className="grid grid-cols-1 items-center gap-2 @[340px]:grid-cols-2 md:flex">
        <div className="flex h-9 rounded-lg border border-line bg-surface p-1">
          {TABS.map((tab) => (
            <Link
              key={tab.value}
              href={homeHref({ ...query, tab: tab.value, page: 1 })}
              className={cx(
                "flex flex-1 items-center justify-center rounded-md px-1.5 text-xs font-medium whitespace-nowrap transition-colors md:flex-none md:px-3 md:text-sm",
                query.tab === tab.value
                  ? "bg-fg text-bg"
                  : "text-muted hover:text-fg",
              )}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Category dropdown for phones and tablets, where the sidebar's category list is hidden. */}
        <label className="relative md:hidden">
          <span className="sr-only">Category</span>
          <select
            value={query.category ?? ""}
            onChange={(e) =>
              router.push(
                homeHref({ ...query, category: e.target.value || undefined, page: 1 }),
              )
            }
            className="h-9 w-full appearance-none rounded-lg border border-line bg-surface pr-8 pl-3 text-[13px] text-fg outline-none focus:border-accent focus:ring-2 focus:ring-accent/30"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name} ({c.threadCount})
              </option>
            ))}
          </select>
          <ChevronDown
            size={16}
            className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted"
          />
        </label>
      </div>
    </div>
  );
}

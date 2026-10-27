import { Suspense } from "react";
import Link from "next/link";
import { connection } from "next/server";
import FilterStrip from "@/components/FilterStrip";
import Logo from "@/components/Logo";
import LookupBox from "@/components/LookupBox";
import { SignInButton } from "@/components/SignInDialog";
import ThreadList from "@/components/ThreadList";
import { getCategories, getThreads } from "@/lib/api";
import type { Tab, ThreadQuery } from "@/lib/types";
import { homeHref } from "@/lib/utils";

export default function Page(props: PageProps<"/">) {
  // searchParams is request data, so the part that reads it streams in behind Suspense.
  return (
    <Suspense fallback={<HomeSkeleton />}>
      <Home searchParams={props.searchParams} />
    </Suspense>
  );
}

async function Home({ searchParams }: { searchParams: PageProps<"/">["searchParams"] }) {
  const query = parseQuery(await searchParams);
  await connection(); // "5h ago" labels use the current time, so render this at request time
  const [categories, threads] = await Promise.all([getCategories(), getThreads(query)]);
  const isHome = !query.category && !query.q; // the welcome card and lookup show here only

  return (
    <div className="space-y-3">
      {isHome && (
        /* Two cards, one row: community on the left, payer lookup on the right. Stacked below laptop width. */
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="card flex items-start gap-3 p-3.5">
            <Logo size={32} className="hidden sm:block" />
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-semibold tracking-tight">AuditProRx Community</h1>
              <p className="mt-0.5 text-xs leading-5 text-muted">
                Independent pharmacies comparing notes on PBM audits, claim rejections, wholesaler invoices, and
                compliance. Read freely, sign in to join.
              </p>
              <SignInButton className="btn-primary mt-2.5 h-7 px-2.5 text-xs">Join the community</SignInButton>
            </div>
          </section>
          <LookupBox />
        </div>
      )}

      <FilterStrip query={query} categories={categories} />

      {query.q && (
        <p className="flex items-center justify-between gap-3 text-sm text-muted">
          <span>
            Results for <strong className="text-fg">“{query.q}”</strong>
          </span>
          <Link href={homeHref({ ...query, q: undefined, page: 1 })} className="hover:text-fg">
            Clear search
          </Link>
        </p>
      )}

      {threads.items.length > 0 ? (
        <ThreadList page={threads} query={query} />
      ) : threads.total > 0 ? (
        // The page number is past the last page, for example an old link after threads were removed.
        <div className="card px-6 py-12 text-center">
          <p className="font-medium">Nothing on page {query.page}</p>
          <p className="mt-1 text-sm text-muted">
            There are {threads.total} threads here, on {Math.ceil(threads.total / threads.pageSize)}{" "}
            {Math.ceil(threads.total / threads.pageSize) === 1 ? "page" : "pages"}.
          </p>
          <Link href={homeHref({ ...query, page: 1 })} className="btn-primary mt-4 h-8 px-3 text-xs">
            Go to page 1
          </Link>
        </div>
      ) : (
        <div className="card px-6 py-12 text-center">
          <p className="font-medium">No threads here yet</p>
          <p className="mt-1 text-sm text-muted">
            {query.q ? "Try a different word or clear the search." : "Try another tab or category."}
          </p>
        </div>
      )}
    </div>
  );
}

const TABS: Tab[] = ["latest", "top", "unanswered"];

/** Turn the URL query string into a typed query with safe defaults. */
function parseQuery(sp: Record<string, string | string[] | undefined>): ThreadQuery {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) ?? "";
  const tab = first(sp.tab) as Tab;
  const page = Number.parseInt(first(sp.page), 10);
  return {
    tab: TABS.includes(tab) ? tab : "latest",
    category: first(sp.category) || undefined,
    q: first(sp.q).trim() || undefined,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  };
}

function HomeSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-24 rounded-xl bg-line" />
      <div className="h-9 w-64 rounded-lg bg-line" />
      <div className="h-28 rounded-xl bg-line" />
      <div className="card divide-y divide-line">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="h-16" />
        ))}
      </div>
    </div>
  );
}

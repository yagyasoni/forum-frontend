"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, LogIn } from "lucide-react";
import { SignInButton } from "./SignInDialog";
import type { Category } from "@/lib/types";
import { cx } from "@/lib/utils";

const DOTS = ["bg-teal-500", "bg-sky-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-emerald-500"];

export default function SidebarNav({ categories }: { categories: Category[] }) {
  const onHome = usePathname() === "/";
  const activeCategory = useSearchParams().get("category");

  return (
    <nav className="flex flex-1 flex-col gap-5">
      <Link href="/" className={cx("nav-item", onHome && !activeCategory && "nav-item-active")}>
        <Home size={18} /> Home
      </Link>

      <div>
        <p className="section-label px-3">Categories</p>
        <ul className="mt-1.5 flex flex-col gap-0.5">
          {categories.map((c, i) => (
            <li key={c.slug}>
              <Link
                href={`/?category=${c.slug}`}
                className={cx(
                  "nav-item justify-between text-[13px]",
                  onHome && activeCategory === c.slug && "nav-item-active",
                )}
              >
                <span className="flex min-w-0 items-center gap-2.5">
                  <span className={cx("h-2 w-2 shrink-0 rounded-full", DOTS[i % DOTS.length])} />
                  <span className="truncate">{c.name}</span>
                </span>
                <span className="text-xs tabular-nums opacity-70">{c.threadCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* mt-auto: on wide screens this card's bottom lines up with the right rail's last card. */}
      <div className="card mt-auto p-3.5">
        <p className="text-sm font-semibold">Join the discussion</p>
        <p className="mt-1 text-xs leading-5 text-muted">Post, comment, and save threads with a free account.</p>
        <SignInButton className="btn-primary mt-3 w-full">
          <LogIn size={16} /> Sign in
        </SignInButton>
      </div>
    </nav>
  );
}

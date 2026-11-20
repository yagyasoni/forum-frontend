"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Home, LogIn } from "lucide-react";
import { SignInButton } from "./SignInDialog";
import { useMember } from "@/lib/member";
import { MEMBER_CATEGORIES } from "@/lib/member-mock";
import type { Category } from "@/lib/types";
import { cx } from "@/lib/utils";

const DOTS = ["bg-teal-500", "bg-sky-500", "bg-violet-500", "bg-amber-500", "bg-rose-500", "bg-emerald-500"];

export default function SidebarNav({ categories: visitorCategories }: { categories: Category[] }) {
  const member = useMember();
  const categories = member ? memberCategories(visitorCategories, member.profile.favoriteCategorySlugs) : visitorCategories;
  const onHome = usePathname() === "/";
  const activeCategory = useSearchParams().get("category");
  const joinRef = useRef<HTMLDivElement>(null);

  // Keep the Join card's bottom edge on the end of the thread list (the pagination bar) at every
  // scroll position, not only at the very end of the page. The sticky sidebar rests above the page
  // bottom by the footer height; while the list end is inside the viewport the card slides down to
  // meet it, and as the list end approaches from below the card dips to be there when it arrives.
  useEffect(() => {
    const card = joinRef.current;
    const main = document.querySelector("main");
    if (!card || !main) return;
    let shift = 0;
    let frame = 0;

    const update = () => {
      frame = 0;
      if (!card.offsetParent) return; // sidebar hidden on phones
      const vh = window.innerHeight;
      const target = main.getBoundingClientRect().bottom; // end of the list
      const rest = card.getBoundingClientRect().bottom - shift; // where the card sits unshifted
      let next = target <= vh ? Math.max(0, target - rest) : Math.max(0, 2 * vh - rest - target);
      if (next < 0.5) next = 0; // sub-pixel layout noise, not a real gap
      if (next !== shift) {
        shift = next;
        card.style.transform = shift ? `translateY(${shift}px)` : "";
      }
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    const observer = new ResizeObserver(schedule); // list grows when comments expand
    observer.observe(main);
    return () => {
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      observer.disconnect();
      cancelAnimationFrame(frame);
    };
  }, [member]); // the card is only there for visitors

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
              {/* Long names wrap onto a second line instead of being cut off. */}
              <Link
                href={`/?category=${c.slug}`}
                className={cx(
                  "nav-item items-start justify-between text-[13px] leading-5",
                  onHome && activeCategory === c.slug && "nav-item-active",
                )}
              >
                <span className="flex min-w-0 items-start gap-2.5">
                  <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", DOTS[i % DOTS.length])} />
                  <span>{c.name}</span>
                </span>
                <span className="shrink-0 pl-2 text-xs tabular-nums opacity-70">{c.threadCount}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* mt-auto: sits at the bottom of the sticky box; the effect above keeps it on the pagination bar. */}
      {!member && (
        <div ref={joinRef} className="card guest-only mt-auto p-3.5">
          <p className="text-sm font-semibold">Join the discussion</p>
          <p className="mt-1 text-xs leading-5 text-muted">Post, comment, and save threads with a free account.</p>
          <SignInButton className="btn-primary mt-3 w-full">
            <LogIn size={16} /> Sign in
          </SignInButton>
        </div>
      )}
    </nav>
  );
}

/** What a member sees: favorites first, then the rest, then the members-only categories. */
function memberCategories(visitorCategories: Category[], favorites: string[]) {
  const all = [...visitorCategories, ...MEMBER_CATEGORIES.filter((m) => !visitorCategories.some((c) => c.slug === m.slug))];
  return [...all.filter((c) => favorites.includes(c.slug)), ...all.filter((c) => !favorites.includes(c.slug))];
}

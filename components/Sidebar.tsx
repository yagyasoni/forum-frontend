import { getCategories } from "@/lib/api";
import SidebarNav from "./SidebarNav";

/** Left column: loads the categories, the client nav highlights the active one. */
export default async function Sidebar() {
  const categories = await getCategories();

  return (
    /*
      The aside is as tall as the thread list (its row stretches to the content, see app/layout.tsx).
      The sticky box inside it fills the viewport between the top bar and the page bottom, never
      exceeds the aside, and never shrinks below its own content. So it stays put while the threads
      scroll, and at the end of the page its bottom edge (the Join card) lines up with the bottom of
      the thread list, which is the pagination bar.
      Cap = 100vh - 5rem (sticky top) - 1.25rem (container bottom padding) - 3.5rem (footer h-14).
    */
    <aside className="hidden w-60 shrink-0 md:flex md:flex-col">
      <div className="sticky top-20 flex min-h-min max-h-[calc(100vh-9.75rem)] flex-1 flex-col">
        <SidebarNav categories={categories} />
      </div>
    </aside>
  );
}

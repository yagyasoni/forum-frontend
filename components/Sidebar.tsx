import { getCategories } from "@/lib/api";
import SidebarNav from "./SidebarNav";

/** Left column: loads the categories, the client nav highlights the active one. */
export default async function Sidebar() {
  const categories = await getCategories();

  return (
    <aside className="hidden md:block">
      {/* Fills the column height so the nav can push its last card to the bottom edge. */}
      <div className="sticky top-20 flex h-full flex-col">
        <SidebarNav categories={categories} />
      </div>
    </aside>
  );
}

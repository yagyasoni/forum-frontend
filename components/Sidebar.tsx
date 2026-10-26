import { getCategories } from "@/lib/api";
import SidebarNav from "./SidebarNav";

/** Left column: loads the categories, the client nav highlights the active one. */
export default async function Sidebar() {
  const categories = await getCategories();

  return (
    <aside className="hidden w-60 shrink-0 md:block">
      <div className="sticky top-20">
        <SidebarNav categories={categories} />
      </div>
    </aside>
  );
}

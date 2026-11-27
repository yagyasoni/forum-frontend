import { MembersOnly, PageTitle } from "@/components/MemberBits";
import { SavedThreads } from "@/components/MemberLists";
import { NO_INDEX } from "@/lib/seo";

// Signed-in page: kept out of search results (also blocked in robots.txt).
export const metadata = { title: "Saved", robots: NO_INDEX };

export default function Page() {
  return (
    <div className="space-y-3">
      <PageTitle title="Saved" hint="Threads you saved to read later." />
      <MembersOnly title="Sign in to see your saved threads">
        <SavedThreads />
      </MembersOnly>
    </div>
  );
}

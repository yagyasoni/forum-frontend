import { MembersOnly, PageTitle } from "@/components/MemberBits";
import { MyThreads } from "@/components/MemberLists";
import { NO_INDEX } from "@/lib/seo";

// Signed-in page: kept out of search results (also blocked in robots.txt).
export const metadata = { title: "My posts", robots: NO_INDEX };

export default function Page() {
  return (
    <div className="space-y-3">
      <PageTitle title="My posts" hint="Threads you started." />
      <MembersOnly title="Sign in to see your posts">
        <MyThreads />
      </MembersOnly>
    </div>
  );
}

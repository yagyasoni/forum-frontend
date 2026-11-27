import { MembersOnly, PageTitle } from "@/components/MemberBits";
import { ProfileCard } from "@/components/MemberLists";
import { NO_INDEX } from "@/lib/seo";

// Signed-in page: kept out of search results (also blocked in robots.txt).
export const metadata = { title: "Profile", robots: NO_INDEX };

export default function Page() {
  return (
    <div className="space-y-3">
      <PageTitle title="Profile" hint="How you appear next to your posts and comments." />
      <MembersOnly title="Sign in to see your profile">
        <ProfileCard />
      </MembersOnly>
    </div>
  );
}

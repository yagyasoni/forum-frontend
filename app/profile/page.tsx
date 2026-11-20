import { MembersOnly, PageTitle } from "@/components/MemberBits";
import { ProfileCard } from "@/components/MemberLists";

export const metadata = { title: "Profile" };

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

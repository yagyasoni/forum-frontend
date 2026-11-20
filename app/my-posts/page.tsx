import { MembersOnly, PageTitle } from "@/components/MemberBits";
import { MyThreads } from "@/components/MemberLists";

export const metadata = { title: "My posts" };

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

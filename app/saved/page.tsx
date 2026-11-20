import { MembersOnly, PageTitle } from "@/components/MemberBits";
import { SavedThreads } from "@/components/MemberLists";

export const metadata = { title: "Saved" };

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

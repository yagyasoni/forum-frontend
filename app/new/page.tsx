import { Suspense } from "react";
import { MembersOnly, PageTitle } from "@/components/MemberBits";
import NewPostForm from "@/components/NewPostForm";
import { getCategories } from "@/lib/api";
import { NO_INDEX } from "@/lib/seo";

// Signed-in page: kept out of search results (also blocked in robots.txt).
export const metadata = { title: "Create post", robots: NO_INDEX };

export default function Page() {
  return (
    <div className="space-y-3">
      <PageTitle title="Create post" hint="Ask a question or share what worked at your pharmacy." />
      <MembersOnly title="Sign in to post">
        {/* The category list comes from the API, so the form streams in behind Suspense. */}
        <Suspense fallback={<div className="h-96 animate-pulse rounded-lg bg-line" />}>
          <Form />
        </Suspense>
      </MembersOnly>
    </div>
  );
}

async function Form() {
  return <NewPostForm categories={await getCategories()} />;
}

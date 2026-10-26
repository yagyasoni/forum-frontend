import { Suspense } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import ThreadView from "@/components/ThreadView";
import { getThread } from "@/lib/api";

export default function Page(props: PageProps<"/t/[id]">) {
  // params is request data, so the part that reads it streams in behind Suspense.
  return (
    <Suspense fallback={<ThreadSkeleton />}>
      <Thread params={props.params} />
    </Suspense>
  );
}

async function Thread({ params }: { params: PageProps<"/t/[id]">["params"] }) {
  const { id } = await params;
  await connection(); // "5h ago" labels use the current time, so render this at request time
  const data = await getThread(id);
  if (!data) notFound();
  return <ThreadView data={data} />;
}

export async function generateMetadata(props: PageProps<"/t/[id]">) {
  const { id } = await props.params;
  const data = await getThread(id); // deduped with the page's call, see lib/api.ts
  return { title: data?.thread.title ?? "Thread not found" };
}

function ThreadSkeleton() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-5 w-32 rounded bg-line" />
      <div className="card space-y-3 p-6">
        <div className="h-5 w-24 rounded bg-line" />
        <div className="h-7 w-3/4 rounded bg-line" />
        <div className="h-4 w-1/2 rounded bg-line" />
        <div className="h-24 rounded bg-line" />
      </div>
    </div>
  );
}

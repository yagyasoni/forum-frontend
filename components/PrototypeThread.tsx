"use client";

import Link from "next/link";
import { MembersOnly, useHydrated } from "./MemberBits";
import ThreadView from "./ThreadView";
import { usePrototypeThread } from "@/lib/member";

/** A thread that exists only in the prototype: a sample How To / Announcement, or one posted in this browser. */
export default function PrototypeThread({ id }: { id: string }) {
  const data = usePrototypeThread(id);
  const hydrated = useHydrated();

  return (
    <MembersOnly title="This thread is for members">
      {data ? (
        <ThreadView data={data} />
      ) : hydrated ? (
        <div className="card px-6 py-12 text-center">
          <p className="font-medium">Thread not found</p>
          <p className="mt-1 text-sm text-muted">It may have been posted from another browser.</p>
          <Link href="/" className="btn-primary mt-4">
            Back to Home
          </Link>
        </div>
      ) : null}
    </MembersOnly>
  );
}

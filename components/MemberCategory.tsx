"use client";

import { MembersOnly } from "./MemberBits";
import ThreadCard from "./ThreadCard";
import { MEMBER_THREADS } from "@/lib/member-mock";

/** Thread list for a members-only category (How To, Announcements). Prototype: sample threads. */
export default function MemberCategory({ slug }: { slug: string }) {
  const threads = MEMBER_THREADS.filter((t) => t.thread.category.slug === slug);
  return (
    <MembersOnly title="This category is for members">
      <div className="space-y-3">
        {threads.map((t) => (
          <ThreadCard key={t.thread.id} thread={t.thread} />
        ))}
      </div>
    </MembersOnly>
  );
}

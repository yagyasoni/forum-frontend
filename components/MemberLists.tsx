"use client";

import { useState } from "react";
import Link from "next/link";
import { BadgeCheck, Check } from "lucide-react";
import Avatar from "./Avatar";
import ProfileForm from "./ProfileForm";
import ThreadCard from "./ThreadCard";
import { updateProfile, useMember, usePosts, useSaved } from "@/lib/member";
import { ROLE_LABEL, type ThreadRow } from "@/lib/types";

function Threads({ threads, empty, hint }: { threads: ThreadRow[]; empty: string; hint: string }) {
  if (threads.length === 0) {
    return (
      <div className="card px-6 py-12 text-center">
        <p className="font-medium">{empty}</p>
        <p className="mt-1 text-sm text-muted">{hint}</p>
        <Link href="/" className="btn-ghost mt-4">
          Browse threads
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {threads.map((t) => (
        <ThreadCard key={t.id} thread={t} />
      ))}
    </div>
  );
}

/** The Saved page. */
export function SavedThreads() {
  return <Threads threads={useSaved()} empty="Nothing saved yet" hint="Open a thread and press Save to keep it here." />;
}

/** The My posts page. */
export function MyThreads() {
  const threads = usePosts().map((p) => p.thread);
  return <Threads threads={threads} empty="You have not posted yet" hint="Your threads will be listed here." />;
}

/** The Profile page: who you are, and the same form as the first-time setup. */
export function ProfileCard() {
  const member = useMember();
  const [saved, setSaved] = useState(false);
  if (!member) return null;

  return (
    <div className="card p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <Avatar username={member.profile.username} />
        <div className="min-w-0 text-sm">
          <p className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold">{member.profile.username}</span>
            <span className="text-muted">{ROLE_LABEL[member.profile.role]}</span>
            {member.verified && (
              <span className="inline-flex items-center gap-0.5 text-xs text-accent">
                <BadgeCheck size={13} /> Verified Pharmacy
              </span>
            )}
          </p>
          <p className="truncate text-xs text-muted">{member.email}</p>
        </div>
      </div>

      <div className="mt-5 max-w-md border-t border-line pt-5">
        <ProfileForm
          key={member.email}
          initial={member.profile}
          submitLabel="Save changes"
          onSubmit={(profile) => {
            updateProfile(profile);
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
          }}
        />
        {saved && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-accent">
            <Check size={14} /> Saved
          </p>
        )}
      </div>
    </div>
  );
}

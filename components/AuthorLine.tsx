import { BadgeCheck } from "lucide-react";
import { ROLE_LABEL, type Author } from "@/lib/types";

/** Username, role, and the Verified Pharmacy mark. */
export default function AuthorLine({ author }: { author: Author }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span className="font-medium text-fg">{author.username}</span>
      <span className="text-muted">{ROLE_LABEL[author.role]}</span>
      {author.verified && (
        <span className="inline-flex items-center gap-0.5 text-xs text-accent">
          <BadgeCheck size={13} /> Verified Pharmacy
        </span>
      )}
    </span>
  );
}

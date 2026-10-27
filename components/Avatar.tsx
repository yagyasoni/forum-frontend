import { cx } from "@/lib/utils";

// Each username gets a stable color so the same person looks the same everywhere.
const COLORS = [
  "bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-200",
  "bg-sky-100 text-sky-800 dark:bg-sky-900/60 dark:text-sky-200",
  "bg-violet-100 text-violet-800 dark:bg-violet-900/60 dark:text-violet-200",
  "bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200",
  "bg-rose-100 text-rose-800 dark:bg-rose-900/60 dark:text-rose-200",
];

function colorFor(username: string) {
  let hash = 0;
  for (const ch of username) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return COLORS[hash % COLORS.length];
}

export default function Avatar({
  username,
  size = "md",
  className,
}: {
  username: string;
  size?: "sm" | "md";
  className?: string;
}) {
  return (
    <span
      aria-hidden
      className={cx(
        "grid shrink-0 place-items-center rounded-full font-semibold uppercase",
        size === "sm" ? "h-7 w-7 text-[11px]" : "h-9 w-9 text-xs",
        colorFor(username),
        className,
      )}
    >
      {(username || "?").slice(0, 2)}
    </span>
  );
}

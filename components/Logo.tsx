import Image from "next/image";
import mark from "@/public/auditprorx-mark.png";

/** The AuditProRx mark as a square tile, same treatment as the main app. */
export default function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      className={`inline-block shrink-0 overflow-hidden rounded-lg ring-1 ring-black/10 dark:ring-white/15 ${className}`}
      style={{ width: size, height: size }}
    >
      <Image src={mark} alt="AuditProRx" width={size} height={size} className="h-full w-full object-cover" priority />
    </span>
  );
}

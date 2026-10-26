"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

/** Copies the current page URL. Works for visitors, no account needed. */
export default function CopyLink({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked: nothing to do, the URL is still in the address bar
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? <Check size={14} /> : <Link2 size={14} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}

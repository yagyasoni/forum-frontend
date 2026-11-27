"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/** Copies a URL to clipboard. Pass `url` to copy a specific link, otherwise copies the current page. */
export default function CopyLink({ url, className }: { url?: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const target = url ?? window.location.href;
    let ok = false;
    try {
      await navigator.clipboard.writeText(target);
      ok = true;
    } catch {
      // Clipboard API refused (older browser, http on a LAN address, missing permission):
      // fall back to a hidden selection and the legacy copy command.
      const ta = document.createElement("textarea");
      ta.value = target;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        ok = document.execCommand("copy");
      } finally {
        ta.remove();
      }
    }
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button type="button" onClick={copy} aria-label="Share" className={className}>
      {copied ? <Check size={14} /> : <Share2 size={14} />}
      <span className="hidden sm:inline">{copied ? "Copied!" : "Share"}</span>
    </button>
  );
}

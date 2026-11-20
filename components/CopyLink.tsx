"use client";

import { useState } from "react";
import { Check, Link2 } from "lucide-react";

/** Copies the current page URL. Works for visitors, no account needed. */
export default function CopyLink({ className }: { className?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    const url = window.location.href;
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      // Clipboard API refused (older browser, http on a LAN address, missing permission):
      // fall back to a hidden selection and the legacy copy command.
      const ta = document.createElement("textarea");
      ta.value = url;
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
      setTimeout(() => setCopied(false), 1500);
    }
  }

  return (
    <button type="button" onClick={copy} className={className}>
      {copied ? <Check size={14} /> : <Link2 size={14} />}
      {copied ? "Copied" : "Share"}
    </button>
  );
}

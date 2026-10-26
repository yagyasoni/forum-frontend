"use client";

import { useState, type FormEvent } from "react";
import { Loader2, ScanSearch, X } from "lucide-react";
import { lookupPayer } from "@/lib/api";
import type { LookupInput, LookupMatch } from "@/lib/types";

const EMPTY: Required<LookupInput> = { bin: "", pcn: "", group: "" };

/** Compact payer lookup card: BIN / PCN / Group in, PBM and payer type in a panel underneath. */
export default function LookupBox() {
  const [form, setForm] = useState(EMPTY);
  const [results, setResults] = useState<LookupMatch[] | null>(null); // null = panel closed
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (key: keyof LookupInput) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const clean = { bin: form.bin.trim(), pcn: form.pcn.trim(), group: form.group.trim() };
    if (!clean.bin && !clean.pcn && !clean.group) return;
    setLoading(true);
    setError(null);
    try {
      setResults(await lookupPayer(clean));
    } catch {
      setError("Lookup is not available right now.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function close() {
    setForm(EMPTY);
    setResults(null);
    setError(null);
  }

  const fieldClass = "input h-8 min-w-0 flex-1 px-2 font-mono text-[11px] uppercase placeholder:normal-case";

  return (
    // flex-col + justify-between spreads the content over the card's full height next to the community card
    <section className="card relative flex flex-col justify-between gap-2.5 p-3.5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold tracking-tight">
          <ScanSearch size={14} className="text-accent" /> Payer lookup
        </h2>
        <span className="text-[11px] text-muted">PBM and payer type</span>
      </div>

      {/* Stacked widths: fields and button on one row. Full width (lg+): button on its own full-width row. */}
      <form onSubmit={onSubmit} aria-label="Payer lookup" className="flex items-center gap-2 lg:flex-col lg:items-stretch">
        <div className="flex min-w-0 flex-1 items-center gap-2 lg:flex-none">
          <input value={form.bin} onChange={set("bin")} placeholder="BIN" inputMode="numeric" autoComplete="off" className={fieldClass} />
          <input value={form.pcn} onChange={set("pcn")} placeholder="PCN" autoComplete="off" className={fieldClass} />
          <input value={form.group} onChange={set("group")} placeholder="Group" autoComplete="off" className={fieldClass} />
        </div>
        <button type="submit" disabled={loading} className="btn-primary h-8 shrink-0 px-2.5 text-xs lg:w-full">
          {loading ? <Loader2 size={13} className="animate-spin" /> : "Look up"}
        </button>
      </form>

      {results && (
        <div className="card absolute top-full right-0 left-0 z-10 mt-2 overflow-hidden shadow-lg">
          <div className="flex items-center justify-between border-b border-line px-3 py-1.5 text-[11px] text-muted">
            <span>{error ?? `${results.length} ${results.length === 1 ? "match" : "matches"}`}</span>
            <button type="button" onClick={close} aria-label="Close" className="rounded p-0.5 hover:bg-bg hover:text-fg">
              <X size={13} />
            </button>
          </div>

          {!error && results.length === 0 && (
            <p className="px-3 py-2 text-xs text-muted">No record found for this BIN / PCN / Group.</p>
          )}

          {results.length > 0 && (
            // Capped height: a BIN on its own can match dozens of plans in the master sheet.
            <ul className="max-h-80 divide-y divide-line overflow-y-auto text-xs">
              {results.map((r, i) => (
                <li key={`${i}-${r.bin}-${r.pcn}-${r.group}`} className="flex items-center gap-3 px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium leading-tight">{r.pbmName}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted">
                      {r.bin}
                      {r.pcn && ` · ${r.pcn}`}
                      {r.group && ` · ${r.group}`}
                    </p>
                  </div>
                  <span className="chip shrink-0">{r.payerType}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

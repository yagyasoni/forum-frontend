import { ExternalLink, ShieldCheck } from "lucide-react";
import Logo from "./Logo";
import { SignInButton } from "./SignInDialog";
import { getCategories } from "@/lib/api";

const GUIDELINES = [
  "Never post patient names, dates of birth, or prescription numbers.",
  "Be specific: BIN, PCN, reject code, PBM, and dates help others help you.",
  "Keep it professional. Disagree with the claim, not the person.",
];

/** Right column on wide screens: what this place is, the rules, and who runs it. */
export default async function RightRail() {
  const categories = await getCategories();
  const threads = categories.reduce((n, c) => n + c.threadCount, 0);

  return (
    <aside className="hidden xl:block">
      <div className="sticky top-20 flex flex-col gap-4">
        <section className="card p-4">
          <p className="section-label">About this community</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            Independent pharmacy owners, pharmacists, and technicians comparing notes on PBM audits, claims,
            inventory, and compliance.
          </p>
          <dl className="mt-3 grid grid-cols-2 gap-2">
            <div className="rounded-lg bg-bg px-3 py-2">
              <dt className="text-[11px] text-muted">Threads</dt>
              <dd className="text-base font-semibold tabular-nums">{threads}</dd>
            </div>
            <div className="rounded-lg bg-bg px-3 py-2">
              <dt className="text-[11px] text-muted">Categories</dt>
              <dd className="text-base font-semibold tabular-nums">{categories.length}</dd>
            </div>
          </dl>
          <SignInButton className="btn-primary mt-3 w-full">Sign in to post</SignInButton>
        </section>

        <section className="card p-4">
          <p className="section-label">Community guidelines</p>
          <ul className="mt-2 space-y-2.5 text-sm leading-5 text-muted">
            {GUIDELINES.map((rule) => (
              <li key={rule} className="flex gap-2">
                <ShieldCheck size={16} className="mt-0.5 shrink-0 text-accent" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="card p-4">
          <div className="flex items-center gap-3">
            <Logo size={36} />
            <div>
              <p className="text-sm font-semibold">AuditProRx</p>
              <p className="text-xs text-muted">Pharmacy audit software</p>
            </div>
          </div>
          <p className="mt-3 text-sm leading-6 text-muted">
            Automate PBM audit defense, reconcile wholesaler invoices, and protect revenue.
          </p>
          <a href="https://www.auditprorx.com" target="_blank" rel="noreferrer" className="btn-ghost mt-3 w-full">
            Visit auditprorx.com <ExternalLink size={14} />
          </a>
        </section>
      </div>
    </aside>
  );
}

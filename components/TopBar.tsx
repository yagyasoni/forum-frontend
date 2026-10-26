import Link from "next/link";
import { Search } from "lucide-react";
import Logo from "./Logo";
import { SignInButton } from "./SignInDialog";

export default function TopBar() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-5">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <Logo size={32} />
          <span className="hidden leading-tight sm:block">
            <span className="block text-[15px] font-semibold tracking-tight">AuditProRx</span>
            <span className="block text-[10.5px] font-medium tracking-[0.12em] text-muted uppercase">Community</span>
          </span>
        </Link>

        {/* Plain GET form: submitting goes to /?q=... and the Home page filters the list. */}
        <form action="/" className="relative mx-auto w-full max-w-md">
          <Search size={16} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted" />
          <input name="q" type="search" placeholder="Search threads" className="input bg-bg pl-9" />
        </form>

        <SignInButton className="btn-primary shrink-0">Sign in</SignInButton>
      </div>
    </header>
  );
}

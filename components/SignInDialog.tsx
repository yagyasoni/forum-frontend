"use client";

// One dialog for the whole app. Any button that needs an account calls open().
// This week the two sign-in options are placeholders; next week they become real.

import { createContext, useCallback, useContext, useRef, type ReactNode } from "react";
import { X } from "lucide-react";
import Logo from "./Logo";

const SignInContext = createContext<() => void>(() => {});

/** Returns a function that opens the sign-in dialog. */
export const useSignIn = () => useContext(SignInContext);

/** Wraps the app once in layout.tsx. Renders the dialog and provides open(). */
export function SignInProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const open = useCallback(() => ref.current?.showModal(), []);
  const close = () => ref.current?.close();

  return (
    <SignInContext.Provider value={open}>
      {children}
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) close(); // click on the backdrop closes
        }}
        className="m-auto w-[min(92vw,420px)] rounded-2xl border border-line bg-surface p-0 text-fg shadow-2xl backdrop:bg-black/50"
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <Logo size={40} />
            <button
              type="button"
              onClick={close}
              aria-label="Close"
              className="rounded-md p-1 text-muted hover:bg-bg hover:text-fg"
            >
              <X size={18} />
            </button>
          </div>

          <h2 className="mt-4 text-lg font-semibold tracking-tight">Sign in to AuditProRx Community</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Posting, commenting, and liking need an account. Reading is always free.
          </p>

          <div className="mt-5 flex flex-col gap-2">
            <button type="button" disabled className="btn-ghost h-10">
              Continue with Google
            </button>
            <button type="button" disabled className="btn-primary h-10">
              Continue with AuditProRx
            </button>
          </div>

          <p className="mt-4 text-center text-xs text-muted">Sign-in arrives next week. This is a preview.</p>
        </div>
      </dialog>
    </SignInContext.Provider>
  );
}

/** A button that opens the sign-in dialog. Use it wherever an action needs an account. */
export function SignInButton({ children, className }: { children: ReactNode; className?: string }) {
  const open = useSignIn();
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}

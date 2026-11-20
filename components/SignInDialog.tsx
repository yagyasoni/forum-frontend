"use client";

// One dialog for the whole app. Any button that needs an account calls open().
// Member prototype: both options sign you in inside this browser only, no backend call.
// Steps: choose a method -> (AuditProRx: email and password) -> first time only: profile setup.

import { createContext, useCallback, useContext, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import Logo from "./Logo";
import ProfileForm from "./ProfileForm";
import { findProfile, signIn } from "@/lib/member";

const SignInContext = createContext<() => void>(() => {});

/** Returns a function that opens the sign-in dialog. */
export const useSignIn = () => useContext(SignInContext);

type Step = "choose" | "password" | "setup";

const GOOGLE_DEMO_EMAIL = "member@gmail.com"; // stands in for the account picked in Google's own window

/** Wraps the app once in layout.tsx. Renders the dialog and provides open(). */
export function SignInProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const open = useCallback(() => ref.current?.showModal(), []);
  const close = () => ref.current?.close();

  /** The account is known. Returning members go straight in, new ones set up a profile first. */
  function proceed(address: string) {
    const profile = findProfile(address);
    if (profile) {
      signIn(address, profile);
      close();
    } else {
      setEmail(address);
      setStep("setup");
    }
  }

  function submitPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    proceed(email.trim());
  }

  return (
    <SignInContext.Provider value={open}>
      {children}
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) close(); // click on the backdrop closes
        }}
        onClose={() => {
          setStep("choose");
          setEmail("");
          setPassword("");
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

          {step === "choose" && (
            <>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">Sign in to AuditProRx Community</h2>
              <p className="mt-1 text-sm leading-6 text-muted">
                Posting, commenting, and liking need an account. Reading is always free.
              </p>

              <div className="mt-5 flex flex-col gap-2">
                <button type="button" onClick={() => proceed(GOOGLE_DEMO_EMAIL)} className="btn-ghost h-10">
                  Continue with Google
                </button>
                <button type="button" onClick={() => setStep("password")} className="btn-primary h-10">
                  Continue with AuditProRx
                </button>
              </div>

              <p className="mt-4 text-center text-xs text-muted">Preview: sign-in works in this browser only.</p>
            </>
          )}

          {step === "password" && (
            <>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">Sign in with AuditProRx</h2>
              <p className="mt-1 text-sm leading-6 text-muted">Use the email and password of your AuditProRx account.</p>

              <form onSubmit={submitPassword} className="mt-5 flex flex-col gap-3">
                <label className="block">
                  <span className="text-xs font-medium">Email</span>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@pharmacy.com"
                    autoComplete="email"
                    className="input mt-1.5"
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-medium">Password</span>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="input mt-1.5"
                  />
                </label>
                <button type="submit" className="btn-primary mt-1 h-10">
                  Sign in
                </button>
              </form>

              <button
                type="button"
                onClick={() => setStep("choose")}
                className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs text-muted hover:text-fg"
              >
                <ArrowLeft size={13} /> Other sign-in options
              </button>
              <p className="mt-3 text-center text-xs text-muted">Preview: any email and password will sign you in.</p>
            </>
          )}

          {step === "setup" && (
            <>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">Set up your profile</h2>
              <p className="mt-1 mb-5 text-sm leading-6 text-muted">One time only. You can change these later.</p>
              <ProfileForm
                submitLabel="Join the community"
                onSubmit={(profile) => {
                  signIn(email, profile);
                  close();
                }}
              />
            </>
          )}
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

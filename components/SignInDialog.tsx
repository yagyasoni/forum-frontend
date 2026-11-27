"use client";

// One dialog for the whole app. Any button that needs an account calls open().
// Real auth: email/password via POST /api/auth/login; Google via POST /api/auth/google.

import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { ArrowLeft, Loader2, X } from "lucide-react";
import Logo from "./Logo";
import ProfileForm from "./ProfileForm";
import { signInEmail, signInGoogle, putProfile } from "@/lib/api";
import { useMemberRefresh } from "@/lib/member";

const SignInContext = createContext<() => void>(() => {});

export const useSignIn = () => useContext(SignInContext);

type Step = "choose" | "password" | "setup";

export function SignInProvider({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  const refresh = useMemberRefresh();
  const [step, setStep] = useState<Step>("choose");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const open = useCallback(() => {
    setStep("choose");
    setEmail("");
    setPassword("");
    setError(null);
    ref.current?.showModal();
  }, []);

  const close = useCallback(() => ref.current?.close(), []);

  // Load Google Identity Services if a client ID is configured.
  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) return;
    if (document.getElementById("gsi-script")) return;
    const script = document.createElement("script");
    script.id = "gsi-script";
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    document.head.appendChild(script);
  }, []);

  async function handleGoogleClick() {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google sign-in is not configured for this environment.");
      return;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const google = (window as any).google;
    if (!google?.accounts?.id) {
      setError("Google Identity Services failed to load. Please try again.");
      return;
    }
    setSubmitting(true);
    setError(null);
    let resetTimeout: ReturnType<typeof setTimeout>;
    google.accounts.id.initialize({
      client_id: clientId,
      use_fedcm_for_prompt: false,
      callback: async (response: { credential: string }) => {
        clearTimeout(resetTimeout);
        try {
          const result = await signInGoogle(response.credential);
          if (!result.hasProfile) {
            setStep("setup");
          } else {
            refresh();
            close();
          }
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Google sign-in failed.");
        } finally {
          setSubmitting(false);
        }
      },
    });

    // renderButton renders an invisible button and programmatically clicks it,
    // which opens the Google popup — the only flow that works on http://localhost.
    const container = document.createElement("div");
    container.style.display = "none";
    document.body.appendChild(container);
    google.accounts.id.renderButton(container, { type: "standard" });
    const btn = container.querySelector("div[role=button]") as HTMLElement | null;
    if (btn) {
      btn.click();
    } else {
      google.accounts.id.prompt();
    }
    setTimeout(() => {
      if (container.parentNode) document.body.removeChild(container);
    }, 5000);

    // Reset button after 2 minutes if user never completes sign-in (closed popup, etc).
    resetTimeout = setTimeout(() => {
      setSubmitting(false);
      setError("Google sign-in timed out or was cancelled. Please try again.");
    }, 120000);
  }

  async function submitPassword(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const result = await signInEmail(email.trim(), password);
      if (!result.hasProfile) {
        setStep("setup");
      } else {
        refresh();
        close();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SignInContext.Provider value={open}>
      {children}
      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) close();
        }}
        onClose={() => {
          setStep("choose");
          setEmail("");
          setPassword("");
          setError(null);
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
                <button
                  type="button"
                  onClick={handleGoogleClick}
                  disabled={submitting}
                  className="btn-ghost h-10 inline-flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 size={14} className="animate-spin" /> : null}
                  Continue with Google
                </button>
                <button
                  type="button"
                  onClick={() => { setError(null); setStep("password"); }}
                  className="btn-primary h-10"
                >
                  Continue with AuditProRx
                </button>
                {error && <p className="text-center text-xs text-rose-600 dark:text-rose-400">{error}</p>}
              </div>
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
                {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}
                <button type="submit" disabled={submitting} className="btn-primary mt-1 h-10">
                  {submitting ? "Signing in…" : "Sign in"}
                </button>
              </form>

              <button
                type="button"
                onClick={() => { setStep("choose"); setError(null); }}
                className="mt-4 inline-flex cursor-pointer items-center gap-1 text-xs text-muted hover:text-fg"
              >
                <ArrowLeft size={13} /> Other sign-in options
              </button>
            </>
          )}

          {step === "setup" && (
            <>
              <h2 className="mt-4 text-lg font-semibold tracking-tight">Set up your profile</h2>
              <p className="mt-1 mb-5 text-sm leading-6 text-muted">One time only. You can change these later.</p>
              <ProfileForm
                submitLabel="Join the community"
                onSubmit={async (profile) => {
                  try {
                    await putProfile(profile.username, profile.role, profile.favoriteCategoryIds);
                    refresh();
                    close();
                  } catch (err: unknown) {
                    setError(err instanceof Error ? err.message : "Could not save profile.");
                  }
                }}
              />
              {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
            </>
          )}
        </div>
      </dialog>
    </SignInContext.Provider>
  );
}

export function SignInButton({ children, className }: { children: ReactNode; className?: string }) {
  const open = useSignIn();
  return (
    <button type="button" onClick={open} className={className}>
      {children}
    </button>
  );
}

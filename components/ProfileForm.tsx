"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check, Shuffle } from "lucide-react";
import { getCategories } from "@/lib/api";
import type { Profile } from "@/lib/member";
import { ROLE_LABEL, type Category, type Role } from "@/lib/types";
import { cx } from "@/lib/utils";

const ROLES = Object.keys(ROLE_LABEL) as Role[];
const USERNAME = /^[A-Za-z0-9_]{3,20}$/;
const ANON = /^Anonymous_\d{6}$/;

/** A handle like Anonymous_482913. It is an ordinary username, so it passes the same rules and uniqueness check. */
function randomAnonName() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return `Anonymous_${String(n).padStart(6, "0")}`;
}

/** Username, role, and favorite categories. Used once after the first sign-in and on the Profile page. */
export default function ProfileForm({
  initial,
  submitLabel,
  onSubmit,
}: {
  initial?: Profile;
  submitLabel: string;
  onSubmit: (profile: Profile) => void | Promise<void>;
}) {
  const startsAnonymous = ANON.test(initial?.username ?? "");
  const [anonymous, setAnonymous] = useState(startsAnonymous);
  // The typed name and the generated anonymous name are kept apart so switching back and forth loses neither.
  const [username, setUsername] = useState(startsAnonymous ? "" : (initial?.username ?? ""));
  const [anonName, setAnonName] = useState(startsAnonymous ? initial!.username : "");
  const [role, setRole] = useState<Role>(initial?.role ?? "owner");
  const [favorites, setFavorites] = useState<string[]>(initial?.favoriteCategoryIds ?? []);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCategories()
      .then((list) => active && setCategories(list))
      .catch(() => {}); // favorites are optional, the form works without the list
    return () => {
      active = false;
    };
  }, []);

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const name = anonymous ? anonName : username.trim();
    if (!anonymous && ANON.test(name)) {
      setError('Names like "Anonymous_123456" are reserved. Choose "Stay anonymous" instead.');
      return;
    }
    if (!USERNAME.test(name)) {
      setError("Use 3 to 20 letters, numbers, or underscores.");
      return;
    }
    onSubmit({ username: name, role, favoriteCategoryIds: favorites });
  }

  const toggle = (slug: string) =>
    setFavorites((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]));

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <div>
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="profile-username" className="text-xs font-medium">
            Username
          </label>
          <div role="radiogroup" aria-label="How you appear" className="inline-flex rounded-md border border-line p-0.5 text-xs">
            {[
              { on: false, label: "Choose a name" },
              { on: true, label: "Stay anonymous" },
            ].map((opt) => (
              <button
                key={opt.label}
                type="button"
                role="radio"
                aria-checked={anonymous === opt.on}
                onClick={() => {
                  setAnonymous(opt.on);
                  if (opt.on && !anonName) setAnonName(randomAnonName());
                  setError(null);
                }}
                className={cx(
                  "cursor-pointer rounded px-2 py-1 font-medium transition-colors",
                  anonymous === opt.on ? "bg-fg text-bg" : "text-muted hover:text-fg",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {anonymous ? (
          <div className="mt-1.5 flex gap-2">
            <input id="profile-username" value={anonName} readOnly className="input flex-1 text-muted" />
            <button
              type="button"
              onClick={() => {
                setAnonName(randomAnonName());
                setError(null);
              }}
              aria-label="Generate a different anonymous name"
              title="Generate a different name"
              className="btn-ghost inline-flex h-10 w-10 shrink-0 items-center justify-center"
            >
              <Shuffle size={15} />
            </button>
          </div>
        ) : (
          <input
            id="profile-username"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError(null);
            }}
            placeholder="rxowner_nj"
            autoComplete="off"
            maxLength={20}
            className="input mt-1.5"
          />
        )}

        <span className={cx("mt-1 block text-xs", error ? "text-rose-600 dark:text-rose-400" : "text-muted")}>
          {error ??
            (anonymous
              ? "Your name, email, and pharmacy name are never shown. You can pick a username later."
              : "Shown next to your posts and comments.")}
        </span>
      </div>

      <label className="block">
        <span className="text-xs font-medium">I am a</span>
        <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="input mt-1.5">
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {ROLE_LABEL[r]}
            </option>
          ))}
        </select>
      </label>

      {categories.length > 0 && (
        <fieldset>
          <legend className="text-xs font-medium">
            Favorite categories <span className="font-normal text-muted">(optional)</span>
          </legend>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {categories.map((c) => {
              const on = favorites.includes(c.id); // favorites are stored as category ids
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggle(c.id)}
                  aria-pressed={on}
                  className={cx(
                    "inline-flex h-7 cursor-pointer items-center gap-1 rounded-md border px-2 text-xs font-medium transition-colors",
                    on ? "border-fg bg-fg text-bg" : "border-line bg-surface text-muted hover:text-fg",
                  )}
                >
                  {on && <Check size={12} />}
                  {c.name}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <button type="submit" className="btn-primary h-10">
        {submitLabel}
      </button>
    </form>
  );
}

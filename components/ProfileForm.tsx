"use client";

import { useEffect, useState, type FormEvent } from "react";
import { Check } from "lucide-react";
import { getCategories } from "@/lib/api";
import type { Profile } from "@/lib/member";
import { ROLE_LABEL, type Category, type Role } from "@/lib/types";
import { cx } from "@/lib/utils";

const ROLES = Object.keys(ROLE_LABEL) as Role[];
const USERNAME = /^[A-Za-z0-9_]{3,20}$/;

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
  const [username, setUsername] = useState(initial?.username ?? "");
  const [role, setRole] = useState<Role>(initial?.role ?? "owner");
  const [favorites, setFavorites] = useState<string[]>(initial?.favoriteCategorySlugs ?? []);
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
    const name = username.trim();
    if (!USERNAME.test(name)) {
      setError("Use 3 to 20 letters, numbers, or underscores.");
      return;
    }
    onSubmit({ username: name, role, favoriteCategorySlugs: favorites });
  }

  const toggle = (slug: string) =>
    setFavorites((list) => (list.includes(slug) ? list.filter((s) => s !== slug) : [...list, slug]));

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className="block">
        <span className="text-xs font-medium">Username</span>
        <input
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
        <span className={cx("mt-1 block text-xs", error ? "text-rose-600 dark:text-rose-400" : "text-muted")}>
          {error ?? "Shown next to your posts and comments."}
        </span>
      </label>

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
              const on = favorites.includes(c.slug);
              return (
                <button
                  key={c.slug}
                  type="button"
                  onClick={() => toggle(c.slug)}
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

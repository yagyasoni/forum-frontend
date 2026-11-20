"use client";

import { useRef, useState, type ChangeEvent, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ImagePlus, X } from "lucide-react";
import { createPost } from "@/lib/member";
import { isMemberCategory } from "@/lib/member-mock";
import type { Category } from "@/lib/types";

const MAX_IMAGE_BYTES = 1_500_000; // the picture is kept in the browser for the prototype, so keep it small

/** New post: category, title, body, optional image. Prototype: the post is kept in this browser. */
export default function NewPostForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  // How To and Announcements are written by the AuditProRx team, not by members.
  const options = categories.filter((c) => !isMemberCategory(c.slug));
  const [category, setCategory] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [image, setImage] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  /** Change a field and clear the message from the last attempt. */
  function edit(set: (value: string) => void, value: string) {
    set(value);
    setError(null);
  }

  function pickImage(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_IMAGE_BYTES) {
      setError("That image is over 1.5 MB. Pick a smaller one.");
      e.target.value = "";
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = () => setImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  function removeImage() {
    setImage(undefined);
    if (fileRef.current) fileRef.current.value = "";
  }

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const chosen = options.find((c) => c.slug === category);
    if (!chosen) return setError("Choose a category.");
    if (!title.trim()) return setError("Add a title.");
    if (!body.trim()) return setError("Write something in the body.");
    const id = createPost({ category: { slug: chosen.slug, name: chosen.name }, title, body, imageUrl: image });
    if (id) router.push(`/t/${id}`);
  }

  return (
    <form onSubmit={submit} className="card flex flex-col gap-4 p-5 sm:p-6">
      <label className="block">
        <span className="text-xs font-medium">Category</span>
        <select value={category} onChange={(e) => edit(setCategory, e.target.value)} className="input mt-1.5">
          <option value="">Choose a category</option>
          {options.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="flex items-center justify-between text-xs font-medium">
          Title <span className="font-normal text-muted tabular-nums">{title.length}/150</span>
        </span>
        <input
          value={title}
          onChange={(e) => edit(setTitle, e.target.value)}
          maxLength={150}
          placeholder="Caremark desk audit asking for 2023 invoices, what do they accept?"
          className="input mt-1.5"
        />
      </label>

      <label className="block">
        <span className="text-xs font-medium">Body</span>
        <textarea
          value={body}
          onChange={(e) => edit(setBody, e.target.value)}
          rows={8}
          maxLength={20000}
          placeholder="Give the details: BIN, PCN, reject code, PBM, and dates help others help you."
          className="input mt-1.5 h-auto min-h-40 resize-y py-2 leading-6"
        />
        <span className="mt-1 block text-xs text-muted">Never include patient names, dates of birth, or prescription numbers.</span>
      </label>

      <div>
        <span className="text-xs font-medium">
          Image <span className="font-normal text-muted">(optional)</span>
        </span>
        <input ref={fileRef} type="file" accept="image/*" onChange={pickImage} className="sr-only" id="post-image" />
        {image ? (
          <div className="relative mt-1.5 overflow-hidden rounded-md border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={image} alt="" className="max-h-64 w-full object-contain" />
            <button
              type="button"
              onClick={removeImage}
              aria-label="Remove image"
              className="absolute top-2 right-2 grid h-7 w-7 cursor-pointer place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <label
            htmlFor="post-image"
            className="mt-1.5 flex h-20 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed border-line text-sm text-muted transition-colors hover:border-accent hover:text-fg"
          >
            <ImagePlus size={16} /> Add an image
          </label>
        )}
      </div>

      {error && <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>}

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Link href="/" className="btn-ghost">
          Cancel
        </Link>
        <button type="submit" className="btn-primary">
          Post
        </button>
      </div>
    </form>
  );
}

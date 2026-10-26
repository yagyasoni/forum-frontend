"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { cx } from "@/lib/utils";

/** A post image that opens full size in an overlay when clicked. `crop` shows a 2:1 crop in list cards. */
export default function ImageLightbox({ src, crop = false }: { src: string; crop?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);

  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        aria-label="Open image"
        className="block w-full cursor-zoom-in overflow-hidden rounded-md border border-line"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" loading="lazy" className={cx("w-full", crop ? "aspect-[2/1] object-cover" : "object-contain")} />
      </button>

      <dialog
        ref={ref}
        onClick={(e) => {
          if (e.target === ref.current) ref.current.close(); // click on the backdrop closes
        }}
        className="m-auto w-[min(96vw,1200px)] max-h-[92vh] overflow-hidden rounded-lg border border-line bg-surface p-0 shadow-2xl backdrop:bg-black/80"
      >
        <button
          type="button"
          onClick={() => ref.current?.close()}
          aria-label="Close"
          className="absolute top-2 right-2 grid h-8 w-8 cursor-pointer place-items-center rounded-full bg-black/60 text-white hover:bg-black/80"
        >
          <X size={16} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="block h-auto max-h-[92vh] w-full object-contain" />
      </dialog>
    </>
  );
}

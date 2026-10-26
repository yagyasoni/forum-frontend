"use client";

/** Shown when a page fails to load, for example when forum-backend is down. */
export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-medium">Something went wrong loading this page.</p>
      <p className="mt-1 text-sm text-muted">The forum API may be unavailable. Try again in a moment.</p>
      <button type="button" onClick={reset} className="btn-primary mt-4">
        Try again
      </button>
    </div>
  );
}

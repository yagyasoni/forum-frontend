import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card px-6 py-12 text-center">
      <p className="font-medium">That thread does not exist.</p>
      <p className="mt-1 text-sm text-muted">It may have been removed, or the link is incomplete.</p>
      <Link href="/" className="btn-primary mt-4">
        Back to threads
      </Link>
    </div>
  );
}

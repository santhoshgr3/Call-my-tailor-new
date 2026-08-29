import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container-cmt py-24 text-center">
      <p className="text-6xl font-extrabold text-brand">404</p>
      <h1 className="mt-3 text-2xl">Page not found</h1>
      <p className="mt-2 text-sm text-muted">
        The page you are looking for doesn&apos;t exist or has moved.
      </p>
      <Link href="/" className="btn-brand mt-6">
        Back to Home
      </Link>
    </div>
  );
}

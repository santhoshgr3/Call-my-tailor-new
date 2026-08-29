import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Login" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  const { next } = await searchParams;
  if (user) redirect(next || "/account");

  return (
    <div className="container-cmt py-12">
      <div className="mx-auto max-w-md">
        <h1 className="mb-6 text-2xl">Login to your account</h1>
        <LoginForm next={next} />
        <p className="mt-4 text-sm text-muted">
          New customer?{" "}
          <Link
            href={`/account/register${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-brand"
          >
            Create an account
          </Link>
        </p>
        <p className="mt-6 rounded border border-line bg-soft p-3 text-xs text-faint">
          Demo accounts — Admin: <b>admin@callmytailor.local</b> / <b>admin123</b> · Customer:{" "}
          <b>customer@example.com</b> / <b>password123</b>
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { RegisterForm } from "./RegisterForm";

export const metadata: Metadata = { title: "Register" };

export default async function RegisterPage({
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
        <h1 className="mb-6 text-2xl">Create an account</h1>
        <RegisterForm next={next} />
        <p className="mt-4 text-sm text-muted">
          Already registered?{" "}
          <Link
            href={`/account/login${next ? `?next=${encodeURIComponent(next)}` : ""}`}
            className="font-semibold text-brand"
          >
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

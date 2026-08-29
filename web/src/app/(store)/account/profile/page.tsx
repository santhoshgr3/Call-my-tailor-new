import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { ProfileForms } from "./ProfileForms";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireUser("/account/profile");
  return (
    <div className="container-cmt py-10">
      <nav className="mb-4 text-xs text-faint">
        <Link href="/account" className="hover:text-brand">
          My Account
        </Link>{" "}
        / <span className="text-ink">Profile</span>
      </nav>
      <h1 className="mb-6 text-2xl">Profile &amp; password</h1>
      <ProfileForms
        user={{
          firstName: user.firstName,
          lastName: user.lastName ?? "",
          email: user.email,
          phone: user.phone ?? "",
        }}
      />
    </div>
  );
}

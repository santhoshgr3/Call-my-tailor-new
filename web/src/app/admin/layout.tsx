import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { AdminNav } from "@/components/admin/AdminNav";
import { logoutAction } from "@/lib/auth-actions";

export const metadata: Metadata = {
  title: "Admin · Call My Tailor",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-soft">
      <div className="flex">
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-line bg-white md:flex">
          <div className="border-b border-line px-5 py-4">
            <span className="block text-lg font-extrabold uppercase text-brand-dark">
              Call<span className="text-brand">My</span>Tailor
            </span>
            <span className="text-[10px] uppercase tracking-widest text-faint">Admin Panel</span>
          </div>
          <AdminNav />
          <div className="mt-auto border-t border-line px-5 py-3 text-xs text-faint">
            <p className="truncate">{admin.email}</p>
            <form action={logoutAction}>
              <button className="mt-1 text-brand hover:underline">Logout</button>
            </form>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="border-b border-line bg-white px-5 py-3 md:hidden">
            <span className="font-extrabold uppercase text-brand-dark">CMT Admin</span>
          </div>
          <div className="p-5 md:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

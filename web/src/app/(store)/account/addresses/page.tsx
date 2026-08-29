import Link from "next/link";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  saveAddressAction,
  deleteAddressAction,
  setDefaultAddressAction,
} from "../actions";

export const metadata: Metadata = { title: "Addresses" };

const field = "w-full border border-line px-3 py-2 text-sm outline-none focus:border-brand";

export default async function AddressesPage() {
  const user = await requireUser("/account/addresses");
  const addresses = await db.address.findMany({
    where: { customerId: user.id },
    orderBy: [{ isDefault: "desc" }],
  });

  return (
    <div className="container-cmt py-10">
      <nav className="mb-4 text-xs text-faint">
        <Link href="/account" className="hover:text-brand">
          My Account
        </Link>{" "}
        / <span className="text-ink">Addresses</span>
      </nav>
      <h1 className="mb-6 text-2xl">Saved addresses</h1>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {addresses.length === 0 && (
            <p className="rounded border border-line p-6 text-sm text-faint">
              No saved addresses yet.
            </p>
          )}
          {addresses.map((a) => (
            <div key={a.id} className="rounded border border-line p-4">
              <details>
                <summary className="cursor-pointer">
                  <span className="font-semibold">{a.fullName}</span>
                  {a.isDefault && <span className="ml-2 text-xs text-brand">(default)</span>}
                  <span className="block text-sm text-muted">
                    {a.line1}
                    {a.line2 ? `, ${a.line2}` : ""}, {a.city}, {a.state} — {a.pincode}
                  </span>
                  <span className="text-sm text-muted">{a.phone}</span>
                </summary>
                <form action={saveAddressAction} className="mt-3 grid gap-2 sm:grid-cols-2">
                  <input type="hidden" name="id" value={a.id} />
                  <input name="fullName" defaultValue={a.fullName} className={field} placeholder="Full name" />
                  <input name="phone" defaultValue={a.phone} className={field} placeholder="Phone" />
                  <input name="line1" defaultValue={a.line1} className={`${field} sm:col-span-2`} placeholder="Address line 1" />
                  <input name="line2" defaultValue={a.line2 ?? ""} className={`${field} sm:col-span-2`} placeholder="Address line 2" />
                  <input name="city" defaultValue={a.city} className={field} placeholder="City" />
                  <input name="state" defaultValue={a.state} className={field} placeholder="State" />
                  <input name="pincode" defaultValue={a.pincode} className={field} placeholder="Pincode" />
                  <label className="flex items-center gap-2 text-sm">
                    <input type="checkbox" name="isDefault" defaultChecked={a.isDefault} className="h-4 w-4" />
                    Default address
                  </label>
                  <div className="sm:col-span-2">
                    <button className="btn-brand !py-1.5 !text-[11px]">Save</button>
                  </div>
                </form>
              </details>
              <div className="mt-2 flex gap-3 text-xs">
                {!a.isDefault && (
                  <form action={setDefaultAddressAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <button className="text-brand hover:underline">Set as default</button>
                  </form>
                )}
                <form action={deleteAddressAction}>
                  <input type="hidden" name="id" value={a.id} />
                  <button className="text-faint hover:text-brand">Delete</button>
                </form>
              </div>
            </div>
          ))}
        </div>

        <div className="h-fit rounded border border-line p-5">
          <h2 className="mb-3 text-sm font-bold uppercase">Add new address</h2>
          <form action={saveAddressAction} className="grid gap-2">
            <input name="fullName" required className={field} placeholder="Full name" />
            <input name="phone" required className={field} placeholder="Phone" />
            <input name="line1" required className={field} placeholder="Address line 1" />
            <input name="line2" className={field} placeholder="Address line 2 (optional)" />
            <input name="city" required className={field} placeholder="City" />
            <input name="state" required className={field} placeholder="State" />
            <input name="pincode" required className={field} placeholder="Pincode" />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isDefault" className="h-4 w-4" />
              Make default
            </label>
            <button className="btn-brand">Add address</button>
          </form>
        </div>
      </div>
    </div>
  );
}

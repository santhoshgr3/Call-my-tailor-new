import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { formatINR } from "@/lib/money";
import { PageHeader, Card, Field, inputCls, SubmitButton, StatusPill } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

async function saveCoupon(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  const code = String(fd.get("code") || "").trim().toUpperCase();
  if (!code) return;
  const data = {
    code,
    type: String(fd.get("type") || "percent"),
    value: Math.max(0, Math.round(Number(fd.get("value") || 0))),
    minSubtotal: Math.max(0, Math.round(Number(fd.get("minSubtotal") || 0))),
    usageLimit: fd.get("usageLimit") ? Math.round(Number(fd.get("usageLimit"))) : null,
    isActive: fd.get("isActive") === "on",
  };
  if (id) await db.coupon.update({ where: { id }, data });
  else await db.coupon.create({ data });
  revalidatePath("/admin/coupons");
}

async function deleteCoupon(fd: FormData) {
  "use server";
  await requireAdmin();
  const id = String(fd.get("id") || "");
  if (id) await db.coupon.delete({ where: { id } });
  revalidatePath("/admin/coupons");
}

export default async function AdminCoupons() {
  const coupons = await db.coupon.findMany({ orderBy: { createdAt: "desc" } });
  return (
    <div>
      <PageHeader title="Coupons" subtitle={`${coupons.length} coupons`} />
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          {coupons.map((c) => (
            <Card key={c.id}>
              <form action={saveCoupon} className="grid gap-2 sm:grid-cols-2">
                <input type="hidden" name="id" value={c.id} />
                <input name="code" defaultValue={c.code} className={inputCls} />
                <select name="type" defaultValue={c.type} className={inputCls}>
                  <option value="percent">percent (%)</option>
                  <option value="fixed">fixed (₹)</option>
                </select>
                <input name="value" type="number" defaultValue={c.value} className={inputCls} placeholder="Value" />
                <input name="minSubtotal" type="number" defaultValue={c.minSubtotal} className={inputCls} placeholder="Min subtotal" />
                <input name="usageLimit" type="number" defaultValue={c.usageLimit ?? ""} className={inputCls} placeholder="Usage limit" />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="isActive" defaultChecked={c.isActive} className="h-4 w-4" /> Active
                </label>
                <div className="sm:col-span-2 flex items-center justify-between">
                  <span className="text-xs text-faint">
                    Used {c.usedCount}× ·{" "}
                    {c.type === "percent" ? `${c.value}% off` : `${formatINR(c.value)} off`}
                    {c.minSubtotal ? ` over ${formatINR(c.minSubtotal)}` : ""}
                  </span>
                  <SubmitButton className="btn-outline !py-1.5 !text-[11px]">Save</SubmitButton>
                </div>
              </form>
              <form action={deleteCoupon} className="mt-1 text-right">
                <input type="hidden" name="id" value={c.id} />
                <button className="text-xs text-faint hover:text-brand">Delete</button>
              </form>
            </Card>
          ))}
          {coupons.length === 0 && <p className="text-sm text-faint">No coupons yet.</p>}
        </div>
        <Card className="h-fit">
          <h2 className="mb-3 font-bold">Add coupon</h2>
          <form action={saveCoupon} className="space-y-3">
            <Field label="Code"><input name="code" required className={inputCls} placeholder="SUMMER20" /></Field>
            <Field label="Type">
              <select name="type" className={inputCls}>
                <option value="percent">percent (%)</option>
                <option value="fixed">fixed (₹)</option>
              </select>
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Value"><input name="value" type="number" defaultValue={10} className={inputCls} /></Field>
              <Field label="Min subtotal"><input name="minSubtotal" type="number" defaultValue={0} className={inputCls} /></Field>
            </div>
            <Field label="Usage limit (optional)"><input name="usageLimit" type="number" className={inputCls} /></Field>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" /> Active
            </label>
            <SubmitButton>Add coupon</SubmitButton>
          </form>
        </Card>
      </div>
    </div>
  );
}

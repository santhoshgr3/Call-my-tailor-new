import { db } from "@/lib/db";
import { getSiteConfig } from "@/lib/settings";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { savePayments, removeSavedRazorpayKeys } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPayments() {
  const site = await getSiteConfig();
  const row = await db.setting.findUnique({ where: { key: "razorpay" } }).catch(() => null);
  let saved: { key_id?: string; key_secret?: string } = {};
  try {
    saved = row ? JSON.parse(row.value) : {};
  } catch {
    saved = {};
  }
  const hasSaved = Boolean(saved.key_id && saved.key_secret);
  const envConfigured = Boolean(
    (process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID) &&
      process.env.RAZORPAY_KEY_SECRET,
  );
  const codOn = site.payments?.cod_enabled !== false;
  const onlineOn = site.payments?.online_enabled !== false;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Payments"
        subtitle="Choose which payment methods customers see at checkout"
      />

      <form action={savePayments} className="space-y-6">
        <Card>
          <h2 className="mb-3 font-bold">Payment methods</h2>
          <div className="space-y-2 text-sm">
            <label className="flex items-center gap-2">
              <input type="checkbox" name="cod_enabled" defaultChecked={codOn} className="h-4 w-4" />
              Cash / pay on delivery (or after home trial)
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" name="online_enabled" defaultChecked={onlineOn} className="h-4 w-4" />
              Online payment with Razorpay
            </label>
          </div>
          <p className="mt-3 text-xs text-faint">
            If you turn off cash payment, online payment must be working or customers can’t check
            out.
          </p>
        </Card>

        <Card>
          <h2 className="mb-1 font-bold">Razorpay keys</h2>
          <p className="mb-4 text-xs text-faint">
            Status:{" "}
            {hasSaved ? (
              <b className="text-green-700">using keys saved here</b>
            ) : envConfigured ? (
              <b className="text-green-700">using keys from server environment</b>
            ) : (
              <b className="text-brand">not configured — online payment is unavailable</b>
            )}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Key ID">
              <input
                name="key_id"
                defaultValue={saved.key_id ?? ""}
                placeholder="rzp_live_…"
                autoComplete="off"
                className={inputCls}
              />
            </Field>
            <Field
              label="Key secret"
              hint={hasSaved ? "A secret is saved. Leave blank to keep it." : "Stored on the server only."}
            >
              <input
                name="key_secret"
                type="password"
                autoComplete="new-password"
                placeholder={hasSaved ? "•••••••• (saved)" : ""}
                className={inputCls}
              />
            </Field>
          </div>
        </Card>

        <SubmitButton>Save payment settings</SubmitButton>
      </form>

      {hasSaved && (
        <form action={removeSavedRazorpayKeys} className="mt-4">
          <button className="text-xs text-faint hover:text-brand">
            Remove keys saved here (fall back to server environment)
          </button>
        </form>
      )}
    </div>
  );
}

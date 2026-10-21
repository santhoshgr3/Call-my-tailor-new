import { db } from "@/lib/db";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { getInteraktConfig, STATUS_LABELS } from "@/lib/whatsapp-notify";
import { saveWhatsapp, sendTestWhatsapp } from "./actions";

export const dynamic = "force-dynamic";

const ORDER_SAMPLE = `Hi {{1}}, thank you for your order {{2}} at Call My Tailor!
Items: {{3}}
Order total: {{4}}
Paid: {{5}}
Balance: {{6}}
Schedule: {{7}}
Address: {{8}}
Our team will contact you shortly.`;

const STATUS_SAMPLE = `Hi {{1}}, your order {{2}} is now {{3}}. Thank you for choosing Call My Tailor.`;

export default async function AdminWhatsapp() {
  const cfg = await getInteraktConfig();
  const test = await db.setting.findUnique({ where: { key: "interakt_last_test" } }).catch(() => null);
  let last: { ok?: boolean; error?: string; at?: string } = {};
  try {
    last = test ? JSON.parse(test.value) : {};
  } catch {
    last = {};
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="WhatsApp messages"
        subtitle="Send customers an order message on WhatsApp through Interakt"
      />

      <form action={saveWhatsapp} className="space-y-6">
        <Card>
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" name="enabled" defaultChecked={cfg.enabled} className="h-4 w-4" />
            Send WhatsApp messages for orders
          </label>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Field
              label="Interakt API key"
              hint={
                cfg.api_key
                  ? "A key is saved. Leave blank to keep it."
                  : "Interakt → Settings → Developer Settings → API Key. Stored on the server only."
              }
            >
              <input
                name="api_key"
                type="password"
                autoComplete="new-password"
                placeholder={cfg.api_key ? "•••••••• (saved)" : ""}
                className={inputCls}
              />
            </Field>
            <Field label="Default country code" hint="Used when a number has no country code.">
              <input name="country_code" defaultValue={cfg.country_code} className={inputCls} />
            </Field>
            <Field label="Copy every new order to my WhatsApp (optional)" hint="Your number, e.g. 9876543210">
              <input name="admin_phone" defaultValue={cfg.admin_phone} className={inputCls} />
            </Field>
          </div>
        </Card>

        <Card>
          <h2 className="mb-1 font-bold">Order confirmation</h2>
          <p className="mb-3 text-xs text-faint">
            Sent when the payment is confirmed (or when a pay-on-delivery order is placed).
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Approved template name">
              <input name="order_template" defaultValue={cfg.order_template} className={inputCls} />
            </Field>
            <Field label="Language code">
              <input name="order_lang" defaultValue={cfg.order_lang} className={inputCls} />
            </Field>
          </div>
          <p className="mt-4 text-xs font-semibold">
            Create this template in Interakt (body text) and wait for approval:
          </p>
          <pre className="mt-1 whitespace-pre-wrap rounded bg-soft p-3 text-xs">{ORDER_SAMPLE}</pre>
          <p className="mt-2 text-xs text-faint">
            Variables are filled in this order: 1 customer name, 2 order number, 3 items and options, 4 order
            total, 5 amount paid, 6 balance (home-visit orders say it is payable at the visit), 7 schedule and
            measurement, 8 address and Google location. You can change the wording in Interakt, but keep the
            numbered placeholders.
          </p>
        </Card>

        <Card>
          <h2 className="mb-1 font-bold">Order status updates</h2>
          <p className="mb-3 text-xs text-faint">Sent when you change the order status in Orders.</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Approved template name">
              <input name="status_template" defaultValue={cfg.status_template} className={inputCls} />
            </Field>
            <Field label="Language code">
              <input name="status_lang" defaultValue={cfg.status_lang} className={inputCls} />
            </Field>
          </div>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm">
            {Object.entries(STATUS_LABELS).map(([k, label]) => (
              <label key={k} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name={`ev_${k}`}
                  defaultChecked={cfg.status_events.includes(k)}
                  className="h-4 w-4"
                />
                {label}
              </label>
            ))}
          </div>
          <pre className="mt-4 whitespace-pre-wrap rounded bg-soft p-3 text-xs">{STATUS_SAMPLE}</pre>
          <p className="mt-2 text-xs text-faint">Variables: 1 customer name, 2 order number, 3 status.</p>
        </Card>

        <SubmitButton>Save WhatsApp settings</SubmitButton>
      </form>

      <div className="mt-8">
        <Card>
          <h2 className="mb-2 font-bold">Send a test message</h2>
          <p className="mb-3 text-xs text-faint">
            Save the settings first. This sends the order template with sample details.
          </p>
          <form action={sendTestWhatsapp} className="flex flex-wrap items-end gap-3">
            <Field label="Your WhatsApp number">
              <input name="test_phone" placeholder="9876543210" className={inputCls} />
            </Field>
            <SubmitButton>Send test</SubmitButton>
          </form>
          {last.at && (
            <p className={`mt-3 text-xs ${last.ok ? "text-green-700" : "text-brand"}`}>
              Last test ({new Date(last.at).toLocaleString("en-IN")}):{" "}
              {last.ok ? "accepted by Interakt" : last.error}
            </p>
          )}
        </Card>
      </div>
    </div>
  );
}

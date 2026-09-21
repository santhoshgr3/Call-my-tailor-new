import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Card, Field, inputCls, SubmitButton } from "@/components/admin/ui";
import { ImageField } from "@/components/admin/ImageField";
import { getSetting } from "@/lib/settings";
import { getPluginDef, resolvePlugin, type PluginState } from "@/lib/plugin-defs";
import { savePlugin, resetPlugin } from "../actions";

export const dynamic = "force-dynamic";

export default async function PluginSettings({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const def = getPluginDef(id);
  if (!def) notFound();
  const state = await getSetting<PluginState>("plugins", {});
  const r = resolvePlugin(def, state);

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={`${def.icon} ${def.name}`}
        subtitle={def.description}
        action={
          <Link href="/admin/plugins" className="btn-outline !py-2 !text-[11px]">
            ← All plugins
          </Link>
        }
      />

      <form action={savePlugin} className="space-y-6">
        <input type="hidden" name="id" value={def.id} />
        <Card>
          <label className="flex items-center gap-3 text-sm font-semibold">
            <input type="checkbox" name="enabled" defaultChecked={r.enabled} className="h-5 w-5" />
            {r.enabled ? "This plugin is active" : "Turn this plugin on"}
          </label>
        </Card>

        <Card>
          <h2 className="mb-4 font-bold">Settings</h2>
          <div className="space-y-4">
            {def.fields.map((f) => {
              const v = r.config[f.key];
              return (
                <Field key={f.key} label={f.label} hint={f.hint}>
                  {f.type === "textarea" ? (
                    <textarea name={f.key} rows={3} defaultValue={String(v)} placeholder={f.placeholder} className={inputCls} />
                  ) : f.type === "code" ? (
                    <textarea
                      name={f.key}
                      rows={8}
                      defaultValue={String(v)}
                      placeholder={f.placeholder}
                      spellCheck={false}
                      className={inputCls + " font-mono text-xs"}
                    />
                  ) : f.type === "number" ? (
                    <input name={f.key} type="number" min={0} defaultValue={Number(v)} className={inputCls + " max-w-[160px]"} />
                  ) : f.type === "toggle" ? (
                    <span className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name={f.key} defaultChecked={Boolean(v)} className="h-4 w-4" />
                      {v ? "On" : "Off"}
                    </span>
                  ) : f.type === "select" ? (
                    <select name={f.key} defaultValue={String(v)} className={inputCls + " max-w-xs"}>
                      {f.options?.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : f.type === "color" ? (
                    <input name={f.key} type="color" defaultValue={String(v)} className="h-10 w-20 cursor-pointer rounded border border-line" />
                  ) : f.type === "image" ? (
                    <ImageField name={f.key} defaultValue={String(v)} />
                  ) : (
                    <input name={f.key} defaultValue={String(v)} placeholder={f.placeholder} className={inputCls} />
                  )}
                </Field>
              );
            })}
          </div>
        </Card>

        {def.id === "custom-code" && (
          <p className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            Only paste code from sources you trust. Scripts added here run on every page of your
            store, so a faulty snippet can break the site — turn this plugin off to remove it
            instantly.
          </p>
        )}

        <div className="sticky bottom-4 flex flex-wrap gap-3">
          <SubmitButton>Save plugin settings</SubmitButton>
        </div>
      </form>

      <form action={resetPlugin} className="mt-3">
        <input type="hidden" name="id" value={def.id} />
        <button className="text-xs text-faint hover:text-brand">Remove my settings and go back to the defaults</button>
      </form>
    </div>
  );
}

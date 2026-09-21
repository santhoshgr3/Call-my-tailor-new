import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { getSetting } from "@/lib/settings";
import { PLUGINS, PLUGIN_GROUPS, resolvePlugin, type PluginState } from "@/lib/plugin-defs";
import { setPluginEnabled } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminPlugins() {
  const state = await getSetting<PluginState>("plugins", {});
  const enabledCount = PLUGINS.filter((p) => resolvePlugin(p, state).enabled).length;

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Plugins"
        subtitle={`${enabledCount} of ${PLUGINS.length} plugins active — all free, built in, and switched on or off with one click`}
      />

      {PLUGIN_GROUPS.map((group) => {
        const list = PLUGINS.filter((p) => p.group === group);
        if (!list.length) return null;
        return (
          <section key={group} className="mb-8">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-faint">{group}</h2>
            <div className="grid gap-4 md:grid-cols-2">
              {list.map((p) => {
                const r = resolvePlugin(p, state);
                return (
                  <div key={p.id} className="flex flex-col rounded-lg border border-line bg-white p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="grid h-10 w-10 place-items-center rounded-lg bg-soft text-xl">{p.icon}</span>
                        <div>
                          <h3 className="font-bold text-brand-dark">{p.name}</h3>
                          <span
                            className={`text-[11px] font-semibold ${r.enabled ? "text-green-700" : "text-faint"}`}
                          >
                            {r.enabled ? "● Active" : "○ Off"}
                          </span>
                        </div>
                      </div>
                      <form action={setPluginEnabled}>
                        <input type="hidden" name="id" value={p.id} />
                        <input type="hidden" name="enabled" value={r.enabled ? "0" : "1"} />
                        <button
                          className={`rounded px-3 py-1.5 text-[11px] font-bold uppercase ${
                            r.enabled
                              ? "border border-line text-muted hover:border-brand hover:text-brand"
                              : "bg-brand text-white hover:bg-brand-hover"
                          }`}
                        >
                          {r.enabled ? "Turn off" : "Turn on"}
                        </button>
                      </form>
                    </div>
                    <p className="mt-3 flex-1 text-sm text-muted">{p.description}</p>
                    <Link
                      href={`/admin/plugins/${p.id}`}
                      className="mt-4 text-sm font-semibold text-brand hover:underline"
                    >
                      Customize →
                    </Link>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}

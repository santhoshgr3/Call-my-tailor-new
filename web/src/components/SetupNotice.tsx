import type { DbStatus } from "@/lib/health";

const MESSAGES: Record<Exclude<DbStatus, "ok">, { title: string; body: string }> = {
  "no-url": {
    title: "Database not configured",
    body: "Set the DATABASE_URL environment variable to a PostgreSQL connection string (Vercel → Project → Settings → Environment Variables), then redeploy.",
  },
  "no-tables": {
    title: "Database is empty",
    body: "The connection works but the schema hasn't been created yet. From a machine with the same DATABASE_URL in web/.env, run:  cd web && npm run db:deploy",
  },
  unreachable: {
    title: "Can't reach the database",
    body: "DATABASE_URL is set but the database isn't responding. Check the connection string (Supabase: use the Session pooler / :5432 URI) and that the database is running.",
  },
};

export function SetupNotice({ status }: { status: Exclude<DbStatus, "ok"> }) {
  const m = MESSAGES[status];
  return (
    <div className="container-cmt py-24">
      <div className="mx-auto max-w-xl rounded-lg border border-line bg-soft p-8 text-center">
        <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-2xl">
          ⚙️
        </div>
        <h1 className="mt-4 text-xl font-bold text-brand-dark">{m.title}</h1>
        <p className="mt-2 text-sm text-muted">{m.body}</p>
        <p className="mt-4 text-xs text-faint">
          The application deployed fine — this is a one-time data setup step.
        </p>
      </div>
    </div>
  );
}

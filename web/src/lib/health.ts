import { db } from "./db";

export type DbStatus = "ok" | "no-url" | "no-tables" | "unreachable";

export async function dbStatus(): Promise<DbStatus> {
  if (!process.env.DATABASE_URL) return "no-url";
  try {
    // cheap query that also proves the schema exists
    await db.setting.count();
    return "ok";
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (/does not exist|relation .* does not exist|no such table|P2021|P2010/i.test(msg)) {
      return "no-tables";
    }
    return "unreachable";
  }
}

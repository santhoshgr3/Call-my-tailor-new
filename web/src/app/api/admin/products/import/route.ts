import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  readRecords,
  buildCtx,
  planRecord,
  type ImportOptions,
  type ImportMode,
} from "@/lib/product-import";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Read an uploaded .xlsx/.csv and return a preview — nothing is written. */
export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose a file first." }, { status: 400 });
  if (file.size > 4 * 1024 * 1024) {
    return NextResponse.json({ error: "File is larger than 4 MB — split it into smaller files." }, { status: 400 });
  }

  const mode = (["create", "update", "upsert"].includes(String(form.get("mode")))
    ? String(form.get("mode"))
    : "upsert") as ImportMode;
  const opts: ImportOptions = {
    mode,
    createCategories: form.get("createCategories") === "1",
    defaultOptions: form.get("defaultOptions") === "1",
  };

  const { records, unknownHeaders, fatal } = await readRecords(
    Buffer.from(await file.arrayBuffer()),
    file.name,
  );
  if (fatal) return NextResponse.json({ error: fatal }, { status: 400 });
  if (records.length === 0) {
    return NextResponse.json({ error: "No product rows were found in the file." }, { status: 400 });
  }

  const ctx = await buildCtx(records);
  const rows = records.map((r) => planRecord(r, ctx, opts).result);
  const summary = {
    total: rows.length,
    create: rows.filter((r) => r.action === "create").length,
    update: rows.filter((r) => r.action === "update").length,
    skip: rows.filter((r) => r.action === "skip").length,
    error: rows.filter((r) => r.action === "error").length,
  };
  return NextResponse.json({ summary, rows, records, unknownHeaders, opts });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { reviewSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || "Invalid input" },
      { status: 400 },
    );
  }
  const d = parsed.data;
  const product = await db.product.findUnique({ where: { id: d.productId } });
  if (!product) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await db.review.create({
    data: {
      productId: d.productId,
      customerName: d.customerName,
      email: d.email || null,
      rating: d.rating,
      title: d.title || null,
      body: d.body,
      isApproved: false,
    },
  });
  return NextResponse.json({ ok: true, message: "Review submitted for moderation." });
}

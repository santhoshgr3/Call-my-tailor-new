"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  requireUser,
} from "@/lib/auth";
import { registerSchema, loginSchema } from "@/lib/validation";

export type AuthState = { error?: string; ok?: boolean };

export async function registerAction(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName") || "",
    email: String(formData.get("email") || "").toLowerCase(),
    phone: formData.get("phone") || "",
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Invalid input" };
  }
  const data = parsed.data;
  const existing = await db.customer.findUnique({ where: { email: data.email } });
  if (existing) return { error: "An account with this email already exists." };

  const customer = await db.customer.create({
    data: {
      email: data.email,
      passwordHash: await hashPassword(data.password),
      firstName: data.firstName,
      lastName: data.lastName || null,
      phone: data.phone || null,
    },
  });
  await createSession(customer.id);
  const next = String(formData.get("next") || "/account");
  redirect(next);
}

export async function loginAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: String(formData.get("email") || "").toLowerCase(),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: "Enter your email and password." };

  const customer = await db.customer.findUnique({ where: { email: parsed.data.email } });
  if (!customer || !customer.isActive) return { error: "Invalid email or password." };
  const ok = await verifyPassword(parsed.data.password, customer.passwordHash);
  if (!ok) return { error: "Invalid email or password." };

  await createSession(customer.id);
  const next = String(formData.get("next") || "/account");
  redirect(next.startsWith("/") ? next : "/account");
}

export async function logoutAction() {
  await destroySession();
  redirect("/");
}

/* ------------------------- profile ------------------------- */

export async function updateProfileAction(
  _prev: AuthState,
  fd: FormData,
): Promise<AuthState> {
  const user = await requireUser("/account/profile");
  const firstName = String(fd.get("firstName") || "").trim();
  const lastName = String(fd.get("lastName") || "").trim();
  const phone = String(fd.get("phone") || "").trim();
  const email = String(fd.get("email") || "").trim().toLowerCase();
  if (!firstName || !email) return { error: "Name and email are required." };
  if (email !== user.email) {
    const taken = await db.customer.findUnique({ where: { email } });
    if (taken) return { error: "That email is already in use." };
  }
  await db.customer.update({
    where: { id: user.id },
    data: { firstName, lastName: lastName || null, phone: phone || null, email },
  });
  revalidatePath("/account");
  return { ok: true };
}

export async function changePasswordAction(
  _prev: AuthState,
  fd: FormData,
): Promise<AuthState> {
  const user = await requireUser("/account/profile");
  const current = String(fd.get("current") || "");
  const next = String(fd.get("next") || "");
  if (next.length < 6) return { error: "New password must be at least 6 characters." };
  const row = await db.customer.findUnique({ where: { id: user.id } });
  if (!row || !(await verifyPassword(current, row.passwordHash))) {
    return { error: "Current password is incorrect." };
  }
  await db.customer.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(next) },
  });
  return { ok: true };
}

/* ------------------------- addresses ------------------------- */

function addressFields(fd: FormData) {
  return {
    fullName: String(fd.get("fullName") || "").trim(),
    phone: String(fd.get("phone") || "").trim(),
    line1: String(fd.get("line1") || "").trim(),
    line2: String(fd.get("line2") || "").trim() || null,
    city: String(fd.get("city") || "").trim(),
    state: String(fd.get("state") || "").trim(),
    pincode: String(fd.get("pincode") || "").trim(),
    isDefault: fd.get("isDefault") === "on",
  };
}

export async function saveAddressAction(fd: FormData) {
  const user = await requireUser("/account/addresses");
  const id = String(fd.get("id") || "");
  const f = addressFields(fd);
  if (!f.fullName || !f.line1 || !f.city || !f.pincode) return;

  if (f.isDefault) {
    await db.address.updateMany({
      where: { customerId: user.id },
      data: { isDefault: false },
    });
  }
  if (id) {
    const owned = await db.address.findFirst({ where: { id, customerId: user.id } });
    if (owned) await db.address.update({ where: { id }, data: f });
  } else {
    await db.address.create({ data: { ...f, customerId: user.id } });
  }
  revalidatePath("/account/addresses");
  revalidatePath("/account");
}

export async function deleteAddressAction(fd: FormData) {
  const user = await requireUser("/account/addresses");
  const id = String(fd.get("id") || "");
  const owned = await db.address.findFirst({ where: { id, customerId: user.id } });
  if (owned) await db.address.delete({ where: { id } });
  revalidatePath("/account/addresses");
  revalidatePath("/account");
}

export async function setDefaultAddressAction(fd: FormData) {
  const user = await requireUser("/account/addresses");
  const id = String(fd.get("id") || "");
  const owned = await db.address.findFirst({ where: { id, customerId: user.id } });
  if (!owned) return;
  await db.address.updateMany({ where: { customerId: user.id }, data: { isDefault: false } });
  await db.address.update({ where: { id }, data: { isDefault: true } });
  revalidatePath("/account/addresses");
  revalidatePath("/account");
}

"use client";

import { useFormStatus } from "react-dom";
import Link from "next/link";

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-brand-dark">{title}</h1>
        {subtitle && <p className="mt-0.5 text-sm text-faint">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border border-line bg-white p-5 ${className}`}>{children}</div>
  );
}

export function Field({
  label,
  children,
  hint,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-1 block text-xs font-bold uppercase text-faint">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-[11px] text-faint">{hint}</span>}
    </label>
  );
}

export const inputCls =
  "w-full rounded border border-line px-3 py-2 text-sm outline-none focus:border-brand";

export function SubmitButton({
  children = "Save",
  className = "btn-brand",
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button className={className} disabled={pending}>
      {pending ? "Saving…" : children}
    </button>
  );
}

export function LinkButton({
  href,
  children,
  variant = "outline",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "brand" | "outline" | "dark";
}) {
  const cls =
    variant === "brand" ? "btn-brand" : variant === "dark" ? "btn-dark" : "btn-outline";
  return (
    <Link href={href} className={`${cls} !py-2 !text-[11px]`}>
      {children}
    </Link>
  );
}

export function Toggle({
  name,
  defaultChecked,
  label,
}: {
  name: string;
  defaultChecked?: boolean;
  label: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="h-4 w-4" />
      {label}
    </label>
  );
}

export function StatusPill({ value }: { value: string }) {
  const color: Record<string, string> = {
    pending: "bg-amber-100 text-amber-700",
    new: "bg-blue-100 text-blue-700",
    confirmed: "bg-blue-100 text-blue-700",
    in_production: "bg-purple-100 text-purple-700",
    scheduled: "bg-purple-100 text-purple-700",
    contacted: "bg-cyan-100 text-cyan-700",
    ready: "bg-teal-100 text-teal-700",
    shipped: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    paid: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
    unpaid: "bg-gray-100 text-gray-600",
  };
  return (
    <span
      className={`inline-block rounded px-2 py-0.5 text-xs font-medium capitalize ${
        color[value] || "bg-gray-100 text-gray-600"
      }`}
    >
      {value.replace(/_/g, " ")}
    </span>
  );
}

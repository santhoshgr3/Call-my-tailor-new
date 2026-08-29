"use client";

import { useActionState } from "react";
import { registerAction, type AuthState } from "../actions";

export function RegisterForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(registerAction, {});

  return (
    <form action={action} className="space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {state.error && (
        <p className="rounded border border-brand/40 bg-brand/5 px-3 py-2 text-sm text-brand">
          {state.error}
        </p>
      )}
      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-faint">First name</span>
          <input
            name="firstName"
            required
            className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-bold uppercase text-faint">Last name</span>
          <input
            name="lastName"
            className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-brand"
          />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase text-faint">Email</span>
        <input
          name="email"
          type="email"
          required
          className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase text-faint">Phone</span>
        <input
          name="phone"
          className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-xs font-bold uppercase text-faint">Password</span>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          className="w-full border border-line px-3 py-2 text-sm outline-none focus:border-brand"
        />
      </label>
      <button className="btn-brand w-full" disabled={pending}>
        {pending ? "Creating…" : "Create Account"}
      </button>
    </form>
  );
}

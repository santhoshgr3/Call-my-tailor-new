"use client";

import { useActionState } from "react";
import { updateProfileAction, changePasswordAction, type AuthState } from "../actions";

const field = "w-full border border-line px-3 py-2 text-sm outline-none focus:border-brand";

function Msg({ state }: { state: AuthState }) {
  if (state.error)
    return (
      <p className="rounded border border-brand/40 bg-brand/5 px-3 py-2 text-sm text-brand">
        {state.error}
      </p>
    );
  if (state.ok)
    return (
      <p className="rounded border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
        Saved.
      </p>
    );
  return null;
}

export function ProfileForms({
  user,
}: {
  user: { firstName: string; lastName: string; email: string; phone: string };
}) {
  const [pState, pAction, pPending] = useActionState<AuthState, FormData>(
    updateProfileAction,
    {},
  );
  const [wState, wAction, wPending] = useActionState<AuthState, FormData>(
    changePasswordAction,
    {},
  );

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={pAction} className="space-y-3 rounded border border-line p-5">
        <h2 className="text-sm font-bold uppercase">Details</h2>
        <Msg state={pState} />
        <div className="grid grid-cols-2 gap-3">
          <input name="firstName" defaultValue={user.firstName} placeholder="First name" required className={field} />
          <input name="lastName" defaultValue={user.lastName} placeholder="Last name" className={field} />
        </div>
        <input name="email" type="email" defaultValue={user.email} placeholder="Email" required className={field} />
        <input name="phone" defaultValue={user.phone} placeholder="Phone" className={field} />
        <button className="btn-brand" disabled={pPending}>
          {pPending ? "Saving…" : "Save details"}
        </button>
      </form>

      <form action={wAction} className="space-y-3 rounded border border-line p-5">
        <h2 className="text-sm font-bold uppercase">Change password</h2>
        <Msg state={wState} />
        <input name="current" type="password" placeholder="Current password" required className={field} />
        <input name="next" type="password" placeholder="New password (min 6 chars)" required minLength={6} className={field} />
        <button className="btn-brand" disabled={wPending}>
          {wPending ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}

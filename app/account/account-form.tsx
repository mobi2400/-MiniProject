"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";

export function AccountForm({ register }: { register: boolean }) {
  const [error, action, pending] = useActionState(authenticate, "");
  return (
    <form action={action} className="fields">
      <input type="hidden" name="mode" value={register ? "register" : "signin"} />
      <label>Email <input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>Password <input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={12} maxLength={128} required /></label>
      {register && <p>Use at least 12 characters.</p>}
      {error && <p role="alert">{error}</p>}
      <button className="button" disabled={pending}>{pending ? "Working…" : register ? "Create account" : "Sign in"}</button>
    </form>
  );
}

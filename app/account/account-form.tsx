"use client";

import { useActionState } from "react";
import { authenticate } from "./actions";

export function AccountForm({ register }: { register: boolean }) {
  const [error, action, pending] = useActionState(authenticate, "");
  return (
    <form action={action} className="fields">
      <input type="hidden" name="mode" value={register ? "register" : "signin"} />
      <label>Email <input name="email" type="email" autoComplete="email" maxLength={254} required /></label>
      <label>
        Password
        {register && <span style={{ fontSize: "0.875rem", color: "var(--muted)", fontWeight: 400 }}>At least 12 characters</span>}
        <input name="password" type="password" autoComplete={register ? "new-password" : "current-password"} minLength={12} maxLength={128} required />
      </label>
      {error && <p role="alert">{error}</p>}
      <button className="button" disabled={pending}>{pending ? "Working…" : register ? "Create account" : "Sign in"}</button>
    </form>
  );
}

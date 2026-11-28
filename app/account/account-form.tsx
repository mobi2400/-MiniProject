"use client";

import { useActionState, useId } from "react";
import { authenticate } from "./actions";
import { PasswordField } from "../../components/PasswordField";

export function AccountForm({ register }: { register: boolean }) {
  const [error, action, pending] = useActionState(authenticate, "");
  const emailId = useId();
  return (
    <form action={action} className="fields auth-form">
      <input type="hidden" name="mode" value={register ? "register" : "signin"} />
      <div className="field">
        <label htmlFor={emailId}>Email</label>
        <input id={emailId} name="email" type="email" autoComplete="email" maxLength={254} required />
      </div>
      <PasswordField
        label="Password"
        hint={register ? "At least 12 characters" : undefined}
        autoComplete={register ? "new-password" : "current-password"}
        minLength={12}
      />
      {error && <p role="alert" className="auth-error">{error}</p>}
      <button className="button" disabled={pending}>
        {pending ? "Working…" : register ? "Create account" : "Sign in"}
      </button>
    </form>
  );
}

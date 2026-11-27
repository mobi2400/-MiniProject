import Link from "next/link";
import { AccountForm } from "./account-form";

export default async function Account({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const register = (await searchParams).mode === "register";
  return (
    <main className="shell form-page">
      <Link href="/">MiniProject</Link>
      <h1>{register ? "Create an account" : "Sign in"}</h1>
      
      <div style={{ marginBlock: "1rem" }}>
        <p>
          {register ? "Already have an account? " : "New here? "}
          <Link href={register ? "/account" : "/account?mode=register"} style={{ fontWeight: 700, color: "var(--indigo)" }}>
            {register ? "Sign in." : "Create an account."}
          </Link>
        </p>
      </div>

      <AccountForm key={String(register)} register={register} />
    </main>
  );
}

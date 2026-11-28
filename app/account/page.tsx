import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccountId } from "../../lib/session";
import { AccountForm } from "./account-form";

export default async function Account({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const register = (await searchParams).mode === "register";
  // Already signed in: send them to their profile instead of showing the form.
  if (await currentAccountId()) redirect("/profile");
  return (
    <main className="auth-page" id="main-content">
      <section className="auth-card" aria-labelledby="auth-title">
        <p className="kicker">{register ? "Get started" : "Welcome back"}</p>
        <h1 id="auth-title">{register ? "Create your account" : "Sign in"}</h1>
        <p className="auth-lead">
          {register
            ? "Save your jobs and CV, and pick up where you left off."
            : "Continue your career preparation."}
        </p>

        <nav className="segmented" aria-label="Account">
          <Link href="/account" aria-current={register ? undefined : "page"}>Sign in</Link>
          <Link href="/account?mode=register" aria-current={register ? "page" : undefined}>Create account</Link>
        </nav>

        <AccountForm key={String(register)} register={register} />
      </section>
      <p className="auth-footer-note">
        <Link href="/">Back to home</Link>
      </p>
    </main>
  );
}

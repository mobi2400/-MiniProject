import Link from "next/link";
import { AccountForm } from "./account-form";

export default async function Account({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const register = (await searchParams).mode === "register";
  return (
    <main className="shell form-page">
      <Link href="/">MiniProject</Link>
      <h1>{register ? "Create an account" : "Sign in"}</h1>
      <AccountForm key={String(register)} register={register} />
      <Link href={register ? "/account" : "/account?mode=register"}>
        {register ? "Already registered? Sign in" : "Create an account"}
      </Link>
    </main>
  );
}

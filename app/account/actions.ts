"use server";

import { randomBytes, randomUUID, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { redirect } from "next/navigation";
import { one, run } from "../../lib/db";
import { endSession, sessionKey, startSession } from "../../lib/session";

const derive = promisify(scrypt);

export async function authenticate(_: string, formData: FormData): Promise<string> {
  const key = sessionKey();
  if (!key) return "Account access is unavailable. Ask the site operator to configure sessions.";
  const rawEmail = formData.get("email");
  const password = formData.get("password");
  const email = typeof rawEmail === "string" ? rawEmail.trim().toLowerCase() : "";
  const register = formData.get("mode") === "register";
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    return "Enter a password with 12 to 128 characters.";
  }

  let accountId: string;
  if (register) {
    const salt = randomBytes(16).toString("hex");
    const hash = (await derive(password, salt, 64)) as Buffer;
    accountId = randomUUID();
    const result = await run("INSERT INTO accounts VALUES ($1, $2, $3) ON CONFLICT(email) DO NOTHING", [
      accountId,
      email,
      `${salt}:${hash.toString("hex")}`,
    ]);
    if (!result) return "Could not create this account. If you already registered, try signing in.";
  } else {
    const account = await one<{ id: string; password_hash: string }>(
      "SELECT id, password_hash FROM accounts WHERE email = $1",
      [email],
    );
    const [salt, hash] = account?.password_hash.split(":") ?? ["missing-account", "00".repeat(64)];
    const candidate = (await derive(password, salt, 64)) as Buffer;
    if (!timingSafeEqual(candidate, Buffer.from(hash, "hex")) || !account) return "Email or password is incorrect.";
    accountId = account.id;
  }

  await startSession(accountId, key);
  redirect("/profile");
}

export async function signOut() {
  await endSession();
  redirect("/");
}

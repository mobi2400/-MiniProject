import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { one, run } from "./db";

const cookieName = "miniproject_session";
const issuer = "miniproject";
const duration = 60 * 60 * 24 * 7;

export function sessionKey() {
  const key = process.env.SESSION_SECRET;
  if (!key || Buffer.byteLength(key) < 32) return null;
  return new TextEncoder().encode(key);
}

export async function startSession(accountId: string, key: Uint8Array): Promise<void> {
  const id = randomUUID();
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + duration;
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(issuer)
    .setSubject(accountId)
    .setJti(id)
    .setIssuedAt(now)
    .setExpirationTime(expiresAt)
    .sign(key);

  await run("DELETE FROM sessions WHERE expires_at <= $1", [now]);
  await run("INSERT INTO sessions VALUES ($1, $2, $3)", [id, accountId, expiresAt]);
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: duration,
  });
}

export async function readSession(): Promise<{ accountId: string; id: string } | null> {
  const key = sessionKey();
  const token = (await cookies()).get(cookieName)?.value;
  if (!key || !token) return null;
  try {
    const { payload } = await jwtVerify(token, key, { issuer, algorithms: ["HS256"] });
    if (typeof payload.sub !== "string" || typeof payload.jti !== "string") return null;
    return { accountId: payload.sub, id: payload.jti };
  } catch {
    return null;
  }
}

export async function requireAccount(): Promise<string> {
  const session = await readSession();
  const active =
    session &&
    (await one<{ "?column?": number } | { [key: string]: unknown }>(
      "SELECT 1 FROM sessions WHERE id = $1 AND account_id = $2 AND expires_at > $3",
      [session.id, session.accountId, Math.floor(Date.now() / 1000)],
    ));
  if (!session || !active) redirect("/account");
  return session.accountId;
}

export async function endSession(): Promise<void> {
  const session = await readSession();
  if (session) {
    await run("DELETE FROM sessions WHERE id = $1 AND account_id = $2", [session.id, session.accountId]);
  }
  (await cookies()).delete(cookieName);
}

import { randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";

const cookieName = "miniproject_session";
const issuer = "miniproject";
const duration = 60 * 60 * 24 * 7;

export function sessionKey() {
  const key = process.env.SESSION_SECRET;
  if (!key || Buffer.byteLength(key) < 32) return null;
  return new TextEncoder().encode(key);
}

export async function startSession(accountId: string, key: Uint8Array) {
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

  db().prepare("DELETE FROM sessions WHERE expires_at <= ?").run(now);
  db().prepare("INSERT INTO sessions VALUES (?, ?, ?)").run(id, accountId, expiresAt);
  (await cookies()).set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: duration,
  });
}

async function readSession() {
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

export async function requireAccount() {
  const session = await readSession();
  const active = session && db().prepare(
    "SELECT 1 FROM sessions WHERE id = ? AND account_id = ? AND expires_at > ?",
  ).get(session.id, session.accountId, Math.floor(Date.now() / 1000));
  if (!session || !active) redirect("/account");
  return session.accountId;
}

export async function endSession() {
  const session = await readSession();
  if (session) db().prepare("DELETE FROM sessions WHERE id = ? AND account_id = ?").run(session.id, session.accountId);
  (await cookies()).delete(cookieName);
}

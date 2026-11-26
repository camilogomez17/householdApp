import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getConfig } from "./config";

const cookieName = "household_session";
const sessionSeconds = 60 * 60 * 24 * 7;

function digest(secret: string, message: string) {
  return createHmac("sha256", secret).update(message).digest();
}

export async function signIn(key: string) {
  const config = getConfig();
  if (!config || key.length < 32 || key.length > 256) return false;
  const supplied = digest(config.secret, key);
  const member = config.members.find((candidate) =>
    timingSafeEqual(supplied, digest(config.secret, candidate.key)),
  );
  if (!member) return false;
  const expires = Math.floor(Date.now() / 1000) + sessionSeconds;
  const payload = `${member.id}.${expires}`;
  const signature = digest(config.secret, `${payload}.${member.key}`).toString("base64url");
  (await cookies()).set(cookieName, `${payload}.${signature}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: sessionSeconds,
  });
  return true;
}

export async function signOut() {
  (await cookies()).delete(cookieName);
}

export async function currentMember() {
  const config = getConfig();
  const value = (await cookies()).get(cookieName)?.value;
  if (!config || !value || !/^[a-z0-9-]+\.\d+\.[A-Za-z0-9_-]{43}$/.test(value)) return null;
  const [id, expires, signature] = value.split(".");
  const member = config.members.find((candidate) => candidate.id === id);
  if (!member || Number(expires) <= Math.floor(Date.now() / 1000)) return null;
  const supplied = Buffer.from(signature, "base64url");
  const expected = digest(config.secret, `${id}.${expires}.${member.key}`);
  return timingSafeEqual(supplied, expected)
    ? { id: member.id, name: member.name, manager: member.manager }
    : null;
}

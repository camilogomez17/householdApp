import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getConfig } from "./config";

const cookieName = "household_session";
const sessionSeconds = 60 * 60 * 24 * 180;

function sign(secret: string, value: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function matches(signature: string, expected: string) {
  return timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export function memberInvite(id: string, secret: string) {
  return `${id}.${sign(secret, `invite:${id}`)}`;
}

export function accessCode(token: string) {
  const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
  let bits = createHash("sha256").update(`access-code:${token}`).digest().readBigUInt64BE() >> 4n;
  let code = "";
  for (let digit = 0; digit < 12; digit++) {
    code = alphabet[Number(bits & 31n)] + code;
    bits >>= 5n;
  }
  return `${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8)}`;
}

export async function signInWithCode(input: string) {
  if (input.length > 32) return false;
  const code = input.toUpperCase().replace(/[\s-]/g, "").replace(/O/g, "0").replace(/[IL]/g, "1");
  const config = getConfig();
  if (!config || !/^[0-9A-HJKMNP-TV-Z]{12}$/.test(code)) return false;

  const member = config.members.find(({ id }) =>
    matches(code, accessCode(memberInvite(id, config.secret)).replaceAll("-", "")),
  );
  if (!member) return false;
  await setSession(member.id, config.secret);
  return true;
}

export async function signIn(token: string) {
  const config = getConfig();
  if (!config || !/^[a-z0-9-]{1,32}\.[A-Za-z0-9_-]{43}$/.test(token)) return false;
  const [id, signature] = token.split(".");
  if (!config.members.some((member) => member.id === id)
    || !matches(signature, sign(config.secret, `invite:${id}`))) return false;

  await setSession(id, config.secret);
  return true;
}

async function setSession(id: string, secret: string) {
  const expires = Math.floor(Date.now() / 1000) + sessionSeconds;
  const payload = `${id}.${expires}`;
  const session = sign(secret, `session:${payload}`);
  (await cookies()).set(cookieName, `${payload}.${session}`, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: sessionSeconds,
  });
}

export async function signOut() {
  (await cookies()).delete(cookieName);
}

export async function currentMember() {
  const config = getConfig();
  const value = (await cookies()).get(cookieName)?.value;
  if (!config || !value || !/^[a-z0-9-]{1,32}\.\d{1,12}\.[A-Za-z0-9_-]{43}$/.test(value)) return null;
  const [id, expires, signature] = value.split(".");
  const member = config.members.find((candidate) => candidate.id === id);
  if (!member || Number(expires) <= Math.floor(Date.now() / 1000)) return null;
  return matches(signature, sign(config.secret, `session:${id}.${expires}`)) ? member : null;
}

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { get, put } from "@vercel/blob";
export type Person = { id: string; name: string; manager: boolean };
export type Household = { id: string; name: string; members: Person[] };
const hash = (value: string) => createHash("sha256").update(value).digest("hex");
async function read<T>(path: string): Promise<T | null> {
  const result = await get(path, { access: "private", useCache: false });
  if (!result) return null;
  if (result.statusCode !== 200) throw new Error("Storage unavailable");
  return await new Response(result.stream).json() as T;
}
async function create(path: string, value: unknown) {
  await put(path, JSON.stringify(value), { access: "private", addRandomSuffix: false, allowOverwrite: false, contentType: "application/json" });
}
export const readHousehold = (id: string) => read<Household>(`households/${id}/members.json`);
export async function issueCode(householdId: string, memberId: string) {
  const code = randomBytes(24).toString("hex");
  await create(`household-credentials/${hash(code)}.json`, { householdId, memberId });
  return code;
}
export async function lookupCode(code: string) {
  if (!/^[a-f0-9]{48}$/.test(code)) return null;
  return read<{ householdId: string; memberId: string }>(`household-credentials/${hash(code)}.json`);
}
export async function createHousehold(name: string, owner: string) {
  const id = randomUUID();
  const household = { id, name, members: [{ id: "owner", name: owner, manager: true }] };
  await create(`households/${id}/members.json`, household);
  return { household, code: await issueCode(id, "owner") };
}

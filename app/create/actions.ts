"use server";
import { z } from "zod";
import { createHousehold } from "../../lib/households";
import { getConfig, demoMode } from "../../lib/config";
import { setSession } from "../../lib/session";
export async function register(_: { error?: string; code?: string }, form: FormData) {
  const config = getConfig();
  if (!config || demoMode) return { error: "Registration unavailable." };
  const schema = z.string().trim().min(1).max(40);
  const parsed = z.object({ name: schema, owner: schema }).safeParse({ name: form.get("name"), owner: form.get("owner") });
  if (!parsed.success) return { error: "Enter both names (40 characters maximum)." };
  const { household, code } = await createHousehold(parsed.data.name, parsed.data.owner);
  await setSession("owner", config.secret, household.id);
  return { code };
}

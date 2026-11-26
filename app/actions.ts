"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getConfig } from "../lib/config";
import { query } from "../lib/data";
import { currentMember, signIn, signOut } from "../lib/session";

export type FormResult = { error?: string; saved?: boolean };

export async function login(_: FormResult, form: FormData): Promise<FormResult> {
  const key = form.get("key");
  if (typeof key !== "string" || !(await signIn(key.trim()))) {
    return { error: "That access key didn’t match a household member." };
  }
  redirect("/");
}

export async function logout() {
  await signOut();
  redirect("/");
}

const id = z.uuid();
const name = z.string().trim().min(1).max(80);
const groceryStatus = z.enum(["buy", "maintain", "remove"]);
const assignee = z.string().max(32);
const taskAmount = z.string().regex(/^(?:\d{1,5}(?:\.\d{1,2})?)?$/)
  .transform((value) => Math.round(Number(value) * 100)).pipe(z.number().max(1000000));
const dateTime = z.iso.datetime({ local: true, precision: -1 })
  .refine((value) => /^20\d\d-\d\d-\d\dT\d\d:\d\d$/.test(value));
const task = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("grocery-add"), name, quantity: z.string().trim().max(40), status: groceryStatus }),
  z.object({ intent: z.literal("grocery-edit"), id, quantity: z.string().trim().max(40), status: groceryStatus }),
  z.object({ intent: z.enum(["grocery-claim", "grocery-release", "grocery-delete"]), id }),
  z.object({ intent: z.literal("chore-add"), name, assignee, reward: taskAmount, due: z.union([z.literal(""), z.iso.date()]) }),
  z.object({ intent: z.literal("chore-assign"), id, assignee }),
  z.object({ intent: z.enum(["chore-done", "chore-reopen", "chore-paid", "chore-delete"]), id }),
  z.object({ intent: z.literal("schedule-add"), status: z.enum(["home", "away"]), starts: dateTime, ends: dateTime, note: z.string().trim().max(100) }),
  z.object({ intent: z.literal("schedule-delete"), id }),
]);

export async function updateBoard(_: FormResult, form: FormData): Promise<FormResult> {
  const member = await currentMember();
  const config = getConfig();
  if (!member || !config) return { error: "Sign in again to update the board." };

  const parsed = task.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { error: "Check the fields and try again." };

  const input = parsed.data;
  const canAssign = (assigneeId: string) =>
    (member.manager && (!assigneeId || config.members.some((person) => person.id === assigneeId)))
    || assigneeId === member.id;
  const restricted = { error: "You don’t have permission to make that change." };
  let changed: unknown[];
  try {
    switch (input.intent) {
      case "grocery-add":
        changed = await query(`INSERT INTO groceries (id, name, quantity, status)
          VALUES ($1, $2, $3, $4) ON CONFLICT (lower(name)) DO NOTHING RETURNING id`,
        [randomUUID(), input.name, input.quantity, input.status]);
        if (!changed.length) return { error: "That grocery is already on the board." };
        break;
      case "grocery-edit":
        changed = await query(`UPDATE groceries SET quantity=$1, status=$2,
          claimed_by=CASE WHEN $2='buy' THEN claimed_by ELSE NULL END WHERE id=$3 RETURNING id`,
        [input.quantity, input.status, input.id]);
        break;
      case "grocery-claim":
        changed = await query(`UPDATE groceries SET claimed_by=$1 WHERE id=$2
          AND status='buy' AND claimed_by IS NULL RETURNING id`, [member.id, input.id]);
        if (!changed.length) return { error: "That item has already been claimed or moved." };
        break;
      case "grocery-release":
        changed = await query("UPDATE groceries SET claimed_by=NULL WHERE id=$1 AND claimed_by=$2 RETURNING id",
          [input.id, member.id]);
        break;
      case "grocery-delete":
        changed = await query("DELETE FROM groceries WHERE id=$1 AND status='remove' RETURNING id", [input.id]);
        break;
      case "chore-add":
        if ((!member.manager && input.reward > 0) || (input.assignee && !canAssign(input.assignee))) return restricted;
        changed = await query(`INSERT INTO chores (id, name, assignee, reward_cents, due_on)
          VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [randomUUID(), input.name, input.assignee || null, input.reward, input.due || null]);
        break;
      case "chore-assign":
        if (!canAssign(input.assignee)) return restricted;
        changed = await query(`UPDATE chores SET assignee=$1 WHERE id=$2 AND status='open'
          AND ($3=1 OR assignee IS NULL) RETURNING id`, [input.assignee || null, input.id, Number(member.manager)]);
        break;
      case "chore-done":
      case "chore-reopen":
        changed = await query(`UPDATE chores SET status=$1 WHERE id=$2 AND status=$3
          AND assignee IS NOT NULL AND (assignee=$4 OR $5=1) RETURNING id`,
        [input.intent === "chore-done" ? "done" : "open", input.id,
          input.intent === "chore-done" ? "open" : "done", member.id, Number(member.manager)]);
        break;
      case "chore-paid":
        if (!member.manager) return restricted;
        changed = await query(`UPDATE chores SET status='paid', paid_at=now(), paid_by=$1
          WHERE id=$2 AND status='done' AND reward_cents > 0 RETURNING id`, [member.id, input.id]);
        break;
      case "chore-delete":
        if (!member.manager) return restricted;
        changed = await query("DELETE FROM chores WHERE id=$1 AND status='open' RETURNING id", [input.id]);
        break;
      case "schedule-add":
        if (input.ends <= input.starts) return { error: "End time must be after start time." };
        changed = await query(`INSERT INTO schedule (id, member_id, status, starts_at, ends_at, note)
          VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [randomUUID(), member.id, input.status, input.starts, input.ends, input.note]);
        break;
      case "schedule-delete":
        changed = await query("DELETE FROM schedule WHERE id=$1 AND member_id=$2 RETURNING id", [input.id, member.id]);
        break;
    }
  } catch (error) {
    console.error("Household update failed", input.intent, error instanceof Error ? error.name : "");
    return { error: "Couldn’t save the change. Try again in a moment." };
  }

  if (!changed.length) return { error: "This entry changed. Refresh the board and try again." };
  revalidatePath("/");
  return { saved: true };
}

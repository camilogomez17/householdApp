"use server";

import { grocerySections } from "../lib/grocery-sections";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getConfig } from "../lib/config";
import { nextBirthday } from "../lib/calendar";
import { householdDate, shiftDate, updateData } from "../lib/data";
import { currentMember, signIn, signInWithCode, signOut } from "../lib/session";

export type FormResult = { error?: string; saved?: boolean };

export async function acceptInvite(token: string) {
  if (typeof token !== "string" || !(await signIn(token))) {
    return { error: "This link no longer works. Ask for a new household link." };
  }
  return { saved: true };
}

export async function enterAccessCode(_: FormResult, form: FormData): Promise<FormResult> {
  const code = form.get("code");
  if (typeof code !== "string" || !(await signInWithCode(code))) {
    return { error: "That code didn’t match. Check it and try again." };
  }
  redirect("/");
}

export async function logout() {
  await signOut();
  redirect("/");
}

const id = z.uuid();
const name = z.string().trim().min(1).max(80);
const groceryDepartment = z.enum(grocerySections);
const groceryStatus = z.enum(["buy", "maintain", "remove"]);
const assignee = z.string().max(32);
const taskAmount = z.string().regex(/^(?:\d{1,5}(?:\.\d{1,2})?)?$/)
  .transform((value) => Math.round(Number(value) * 100)).pipe(z.number().max(1000000));
const scheduleDate = z.iso.date().refine((value) => value.startsWith("20"));
const scheduleTime = z.iso.time().transform((value) => value.slice(0, 5));
const dateTime = z.iso.datetime({ local: true })
  .refine((value) => /^20\d\d-\d\d-\d\dT[\d:.]+$/.test(value))
  .transform((value) => value.slice(0, 16));
const due = z.union([z.literal(""), z.iso.date()]);
const scheduleFields = {
  status: z.enum(["home", "away"]),
  starts: dateTime,
  ends: dateTime,
  note: z.string().trim().max(100),
};

const eventFields = {
  title: name,
  kind: z.enum(["event", "birthday"]),
  date: z.iso.date(),
  time: z.union([z.literal(""), scheduleTime]),
  note: z.string().trim().max(100),
};

const mealSlot = z.enum(["breakfast", "lunch", "dinner"]);
const mealDate = z.iso.date().refine((value) => value.startsWith("20"));
const mealIngredients = z.array(z.uuid()).min(1).max(30);

const task = z.discriminatedUnion("intent", [
  z.object({ intent: z.literal("meal-propose"), date: mealDate, slot: mealSlot, title: name, ingredientIds: mealIngredients }),
  z.object({ intent: z.literal("meal-vote"), id, proposalId: id }),
  z.object({ intent: z.literal("meal-unvote"), id, proposalId: id }),
  z.object({ intent: z.literal("meal-availability"), id, availability: z.enum(["yes", "maybe", "no"]) }),
  z.object({ intent: z.literal("meal-volunteer"), id }),
  z.object({ intent: z.literal("meal-release"), id }),
  z.object({ intent: z.literal("meal-select"), id, proposalId: id }),
  z.object({ intent: z.literal("meal-unselect"), id }),
  z.object({ intent: z.literal("meal-prepared"), id }),
  z.object({ intent: z.literal("meal-reopen"), id }),
  z.object({ intent: z.literal("meal-delete-proposal"), id, proposalId: id }),
  z.object({ intent: z.literal("calendar-add"), ...eventFields }),
  z.object({ intent: z.literal("calendar-edit"), id, ...eventFields }),
  z.object({ intent: z.literal("calendar-remove"), id }),
  z.object({ intent: z.literal("list-add"), title: name }),
  z.object({ intent: z.literal("list-rename"), id, title: name }),
  z.object({ intent: z.literal("list-remove"), id }),
  z.object({ intent: z.literal("list-item-add"), id, label: name }),
  z.object({ intent: z.literal("list-item-edit"), id, itemId: id, label: name }),
  z.object({ intent: z.literal("list-item-check"), id, itemId: id, checked: z.enum(["yes", "no"]) }),
  z.object({ intent: z.literal("list-item-remove"), id, itemId: id }),
  z.object({ intent: z.literal("grocery-add"), name, quantity: z.string().trim().max(40), status: groceryStatus, section: groceryDepartment }),
  z.object({ intent: z.literal("grocery-edit"), id, name, quantity: z.string().trim().max(40), status: groceryStatus, section: groceryDepartment }),
  z.object({ intent: z.enum(["grocery-claim", "grocery-release", "grocery-delete"]), id }),
  z.object({ intent: z.literal("chore-add"), name, assignee, reward: taskAmount, due }),
  z.object({ intent: z.literal("chore-edit"), id, name, due, assignee: assignee.optional(), reward: taskAmount.optional() }),
  z.object({ intent: z.literal("chore-assign"), id, assignee }),
  z.object({ intent: z.enum(["chore-done", "chore-reopen", "chore-paid", "chore-delete"]), id }),
  z.object({ intent: z.literal("schedule-add"), ...scheduleFields }),
  z.object({ intent: z.literal("schedule-edit"), id, ...scheduleFields }),
  z.object({ intent: z.literal("schedule-delete"), id }),
]);

export async function updateBoard(_: FormResult, form: FormData): Promise<FormResult> {
  const member = await currentMember();
  const config = getConfig();
  if (!member || !config) return { error: "Sign in again to update the board." };

  const fields = Object.fromEntries(form);
  if (fields.kind === "birthday" && "birthdayMonth" in fields) {
    const month = String(fields.birthdayMonth).padStart(2, "0");
    const day = String(fields.birthdayDay).padStart(2, "0");
    fields.date = `2000-${month}-${day}`;
    fields.time = "";
  }
  const scheduleForm = fields.intent === "schedule-add" || fields.intent === "schedule-edit";
  if (scheduleForm && "startDate" in fields) {
    const start = scheduleDate.safeParse(fields.startDate);
    const end = scheduleDate.safeParse(fields.endDate || fields.startDate);
    const startTime = scheduleTime.safeParse(fields.startTime);
    const endTime = scheduleTime.safeParse(fields.endTime);
    if (!start.success || !end.success) return { error: "Enter a valid date for the schedule." };
    if (!startTime.success || !endTime.success) return { error: "Enter both a start time and an end time." };
    fields.starts = `${start.data}T${startTime.data}`;
    fields.ends = `${end.data}T${endTime.data}`;
  }

  const parsed = task.safeParse(fields.intent === "meal-propose" ? { ...fields, ingredientIds: form.getAll("ingredientId") } : fields);
  if (!parsed.success) {
    if (scheduleForm) return { error: "Check the date, both times, and the note (100 characters maximum)." };
    if (fields.intent === "calendar-add" || fields.intent === "calendar-edit") {
      return { error: fields.kind === "birthday"
        ? "Enter a name and a valid birthday month and day."
        : "Enter a name and a valid date. The note can be up to 100 characters." };
    }
    return { error: "Check the fields and try again." };
  }

  const input = parsed.data;
  const repeatDays = scheduleForm ? form.getAll("repeatDay") : [];
  if (repeatDays.length > 7 || repeatDays.some((day) => typeof day !== "string" || !/^[0-6]$/.test(day))) {
    return { error: "Choose valid days for the weekly schedule." };
  }
  const repeatOn = [...new Set(repeatDays.map(Number))];
  const canAssign = (assigneeId: string) =>
    (member.manager && (!assigneeId || config.members.some((person) => person.id === assigneeId)))
    || assigneeId === member.id;
  const restricted = { error: "You don’t have permission to make that change." };
  try {
    const error = await updateData(config.timeZone, (board) => {
      const grocery = "id" in input ? board.groceries.find((item) => item.id === input.id) : undefined;
      const chore = "id" in input ? board.chores.find((item) => item.id === input.id) : undefined;
      if (input.intent === "grocery-add" || input.intent === "grocery-edit") {
        if (board.groceries.some((item) => item.id !== grocery?.id
          && item.name.toLowerCase() === input.name.toLowerCase())) {
          return "That grocery is already on the board.";
        }
      }
      const stale = "This entry changed. Refresh the board and try again.";
      const meal = "id" in input ? board.meals.find((row) => row.id === input.id) : undefined;
      switch (input.intent) {
        case "meal-propose": {
          const today = householdDate(config.timeZone);
          if (input.date < today || input.date > shiftDate(today, 90)) return "Choose a meal date within the next 90 days.";
          const selectedIds = [...new Set(input.ingredientIds)];
          const selected = board.groceries.filter((item) => item.status === "maintain" && selectedIds.includes(item.id));
          if (selected.length !== selectedIds.length) return "Some ingredients are no longer in stock. Refresh and choose again.";
          const ingredients = selected.map((item) => item.name);
          let slot = board.meals.find((row) => row.date === input.date && row.slot === input.slot);
          if (!slot) {
            slot = { id: randomUUID(), date: input.date, slot: input.slot, proposals: [],
              availability: {}, selected_id: null, cook_id: null, prepared: false };
            board.meals.push(slot);
          }
          if (slot.proposals.length >= 20) return "This meal already has 20 suggestions.";
          if (slot.proposals.some((proposal) => proposal.title.toLowerCase() === input.title.toLowerCase())) {
            return "This dish has already been suggested for that meal.";
          }
          slot.proposals.push({ id: randomUUID(), title: input.title, ingredients, suggested_by: member.id, votes: [member.id] });
          break;
        }
        case "meal-vote":
        case "meal-unvote": {
          const proposal = meal?.proposals.find((row) => row.id === input.proposalId);
          if (!proposal) return stale;
          proposal.votes = input.intent === "meal-vote"
            ? [...new Set([...proposal.votes, member.id])]
            : proposal.votes.filter((vote) => vote !== member.id);
          break;
        }
        case "meal-availability":
          if (!meal) return stale;
          if (meal.prepared) return "This meal is already marked prepared.";
          meal.availability[member.id] = input.availability;
          if (meal.cook_id === member.id && input.availability !== "yes") meal.cook_id = null;
          break;
        case "meal-volunteer":
          if (!meal) return stale;
          if (meal.prepared || meal.cook_id || meal.availability[member.id] !== "yes") {
            return "Mark yourself available first, or the meal already has a cook.";
          }
          meal.cook_id = member.id;
          break;
        case "meal-release":
          if (!meal || meal.prepared || (meal.cook_id !== member.id && !member.manager)) return stale;
          meal.cook_id = null;
          break;
        case "meal-select":
          if (!member.manager) return restricted.error;
          if (!meal || !meal.proposals.some((row) => row.id === input.proposalId) || meal.prepared) return stale;
          meal.selected_id = input.proposalId;
          break;
        case "meal-unselect":
          if (!member.manager) return restricted.error;
          if (!meal || meal.prepared) return stale;
          meal.selected_id = null;
          break;
        case "meal-prepared":
          if (!meal || !meal.selected_id || !meal.cook_id || (meal.cook_id !== member.id && !member.manager)) {
            return "A selected dish and an assigned cook are needed to mark it prepared.";
          }
          meal.prepared = true;
          break;
        case "meal-reopen":
          if (!member.manager || !meal?.prepared) return stale;
          meal.prepared = false;
          break;
        case "meal-delete-proposal": {
          const proposal = meal?.proposals.find((row) => row.id === input.proposalId);
          if (!meal || !proposal) return stale;
          if (meal.prepared || (!member.manager && proposal.suggested_by !== member.id)) return restricted.error;
          meal.proposals = meal.proposals.filter((row) => row.id !== input.proposalId);
          if (meal.selected_id === input.proposalId) meal.selected_id = null;
          break;
        }
        case "calendar-add":
        case "calendar-edit": {
          if (input.kind === "event" && !input.date.startsWith("20")) {
            return "Choose an event date between 2000 and 2099.";
          }
          const event = input.intent === "calendar-edit" ? board.events.find((row) => row.id === input.id) : undefined;
          if (input.intent === "calendar-edit" && !event) return stale;
          const details = { title: input.title, kind: input.kind,
            date: input.kind === "birthday" ? input.date.slice(5) : input.date,
            time: input.kind === "birthday" ? "" : input.time, note: input.note };
          if (event) Object.assign(event, details);
          else board.events.push({ id: randomUUID(), ...details });
          break;
        }
        case "calendar-remove":
          if (!board.events.some((event) => event.id === input.id)) return stale;
          board.events = board.events.filter((event) => event.id !== input.id);
          break;
        case "list-add":
          board.lists.push({ id: randomUUID(), title: input.title, items: [] });
          break;
        case "list-rename":
        case "list-remove":
        case "list-item-add":
        case "list-item-edit":
        case "list-item-check":
        case "list-item-remove": {
          const list = board.lists.find((row) => row.id === input.id);
          if (!list) return stale;
          if (input.intent === "list-rename") list.title = input.title;
          else if (input.intent === "list-remove") {
            if (list.items.length) return "Remove the items before deleting this list.";
            board.lists = board.lists.filter((row) => row.id !== list.id);
          } else if (input.intent === "list-item-add") {
            list.items.push({ id: randomUUID(), label: input.label, checked: false });
          } else {
            const item = list.items.find((row) => row.id === input.itemId);
            if (!item) return stale;
            if (input.intent === "list-item-edit") item.label = input.label;
            else if (input.intent === "list-item-check") item.checked = input.checked === "yes";
            else list.items = list.items.filter((row) => row.id !== item.id);
          }
          break;
        }
        case "grocery-add":
          board.groceries.unshift({ id: randomUUID(), name: input.name, quantity: input.quantity,
            status: input.status, section: input.section, claimed_by: null });
          break;
        case "grocery-edit":
          if (!grocery) return stale;
          grocery.name = input.name;
          grocery.quantity = input.quantity;
          grocery.status = input.status;
          grocery.section = input.section;
          if (input.status !== "buy") grocery.claimed_by = null;
          break;
        case "grocery-claim":
          if (!grocery || grocery.status !== "buy" || grocery.claimed_by) {
            return "That item has already been claimed or moved.";
          }
          grocery.claimed_by = member.id;
          break;
        case "grocery-release":
          if (grocery?.claimed_by !== member.id) return stale;
          grocery.claimed_by = null;
          break;
        case "grocery-delete":
          if (grocery?.status !== "remove") return stale;
          board.groceries = board.groceries.filter((item) => item.id !== input.id);
          break;
        case "chore-add":
          if ((!member.manager && input.reward > 0) || (input.assignee && !canAssign(input.assignee))) return restricted.error;
          board.chores.unshift({ id: randomUUID(), name: input.name, assignee: input.assignee || null,
            reward_cents: input.reward, due_on: input.due || null, status: "open", paid_by: null, paid_on: null });
          break;
        case "chore-edit":
          if (!chore) return stale;
          if (!member.manager && (chore.assignee !== member.id || chore.status === "paid"
            || input.assignee !== undefined || input.reward !== undefined)) return restricted.error;

          if (input.assignee !== undefined) {
            if (input.assignee !== chore.assignee && !canAssign(input.assignee)) return restricted.error;
            if (chore.status !== "open" && !input.assignee) return "Choose a member for this completed chore.";
            chore.assignee = input.assignee || null;
          }
          if (input.reward !== undefined) {
            if (chore.status === "paid" && input.reward === 0) return "Enter the amount paid for this chore.";
            chore.reward_cents = input.reward;
          }
          chore.name = input.name;
          chore.due_on = input.due || null;
          break;
        case "chore-assign":
          if (!canAssign(input.assignee)) return restricted.error;
          if (chore?.status !== "open" || (!member.manager && chore.assignee)) return stale;
          chore.assignee = input.assignee || null;
          break;
        case "chore-done":
        case "chore-reopen":
          if (!chore?.assignee || (!member.manager && chore.assignee !== member.id)
            || chore.status !== (input.intent === "chore-done" ? "open" : "done")) return stale;
          chore.status = input.intent === "chore-done" ? "done" : "open";
          break;
        case "chore-paid":
          if (!member.manager) return restricted.error;
          if (chore?.status !== "done" || !chore.reward_cents) return stale;
          chore.status = "paid";
          chore.paid_by = member.id;
          chore.paid_on = householdDate(config.timeZone);
          break;
        case "chore-delete":
          if (!member.manager) return restricted.error;
          if (chore?.status !== "open") return stale;
          board.chores = board.chores.filter((item) => item.id !== input.id);
          break;
        case "schedule-add":
        case "schedule-edit": {
          const existing = input.intent === "schedule-edit"
            ? board.schedule.find((entry) => entry.id === input.id && entry.member_id === member.id)
            : undefined;
          if (input.intent === "schedule-edit" && !existing) return stale;
          if (input.ends <= input.starts) return "End time must be after the start. If it ends overnight, choose the next day as the end date.";
          if (repeatOn.length) {
            const latestEnd = shiftDate(input.starts.slice(0, 10), 1) + input.starts.slice(10);
            if (input.ends > latestEnd) return "A weekly schedule block can be up to 24 hours long.";
          } else if (!existing && input.ends.slice(0, 10) < householdDate(config.timeZone)) {
            return "This entry ends before today. Choose today or a future date.";
          }
          const updated = { status: input.status, starts_at: input.starts, ends_at: input.ends,
            note: input.note, repeat_on: repeatOn.length ? repeatOn : undefined };
          if (existing) Object.assign(existing, updated);
          else board.schedule.push({ id: randomUUID(), member_id: member.id, ...updated });
          break;
        }
        case "schedule-delete":
          if (!board.schedule.some((entry) => entry.id === input.id && entry.member_id === member.id)) return stale;
          board.schedule = board.schedule.filter((entry) => entry.id !== input.id);
          break;
      }
    });
    if (error) return { error };
  } catch (error) {
    console.error("Household update failed", input.intent, error instanceof Error ? error.name : "");
    return { error: "Couldn’t save the change. Try again in a moment." };
  }

  revalidatePath("/");
  if (input.intent === "calendar-add" || input.intent === "calendar-edit") {
    const day = input.kind === "birthday"
      ? nextBirthday(input.date.slice(5), householdDate(config.timeZone))
      : input.date;
    redirect(`/?section=calendar&day=${day}#day-agenda`);
  }
  return { saved: true };
}

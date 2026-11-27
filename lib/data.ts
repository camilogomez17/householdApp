import { BlobPreconditionFailedError, get, put } from "@vercel/blob";
import { randomUUID } from "node:crypto";
import { link, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { demoMode } from "./config";

export type Grocery = {
  id: string;
  name: string;
  quantity: string;
  status: "buy" | "maintain" | "remove";
  claimed_by: string | null;
};
export type Chore = {
  id: string;
  name: string;
  assignee: string | null;
  due_on: string | null;
  reward_cents: number;
  status: "open" | "done" | "paid";
  paid_by: string | null;
  paid_on: string | null;
};
export type ScheduleEntry = {
  id: string;
  member_id: string;
  status: "home" | "away";
  starts_at: string;
  ends_at: string;
  note: string;
  repeat_on?: number[];
};

export type BoardData = { groceries: Grocery[]; chores: Chore[]; schedule: ScheduleEntry[] };
type Update = (board: BoardData) => string | undefined;

const pathname = "household/board-v1.json";
const demoFile = ".data/board-v1.json";
const local = globalThis as typeof globalThis & { householdWrite?: Promise<unknown> };

export function householdDate(timeZone: string, at = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(at);
}

export function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

function upcomingSchedule(entries: ScheduleEntry[], today: string) {
  // Include yesterday's starts so overnight occurrences ending today appear.
  const dates = Array.from({ length: 15 }, (_, index) => shiftDate(today, index - 1));
  return entries.flatMap((entry) => {
    if (!entry.repeat_on?.length) return entry.ends_at.slice(0, 10) >= today ? [entry] : [];
    const firstDay = entry.starts_at.slice(0, 10);
    const overnight = entry.ends_at.slice(0, 10) > firstDay;
    return dates.flatMap((day) => {
      const weekday = new Date(`${day}T12:00:00Z`).getUTCDay();
      if (day < firstDay || !entry.repeat_on?.includes(weekday)) return [];
      const end = overnight ? shiftDate(day, 1) : day;
      if (end < today) return [];
      return [{ ...entry, starts_at: day + entry.starts_at.slice(10), ends_at: end + entry.ends_at.slice(10) }];
    });
  }).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
}

function demoBoard(timeZone: string): BoardData {
  const today = householdDate(timeZone);
  const nextDay = shiftDate(today, 1);
  return {
    groceries: [
      { id: randomUUID(), name: "Oat milk", quantity: "2 cartons", status: "buy", claimed_by: null },
      { id: randomUUID(), name: "Eggs", quantity: "1 dozen", status: "buy", claimed_by: "jordan" },
      { id: randomUUID(), name: "Rice", quantity: "Keep 1 bag", status: "maintain", claimed_by: null },
      { id: randomUUID(), name: "Old yogurt", quantity: "1 tub", status: "remove", claimed_by: null },
    ],
    chores: [
      { id: randomUUID(), name: "Take out recycling", assignee: "sam", due_on: today, reward_cents: 500, status: "open", paid_by: null, paid_on: null },
      { id: randomUUID(), name: "Clean the kitchen", assignee: null, due_on: nextDay, reward_cents: 1500, status: "open", paid_by: null, paid_on: null },
      { id: randomUUID(), name: "Water the plants", assignee: "jordan", due_on: nextDay, reward_cents: 800, status: "done", paid_by: null, paid_on: null },
    ],
    schedule: [
      { id: randomUUID(), member_id: "jordan", status: "away", starts_at: `${today}T09:00`, ends_at: `${today}T17:00`, note: "Work" },
      { id: randomUUID(), member_id: "alex", status: "home", starts_at: `${today}T16:00`, ends_at: `${today}T20:00`, note: "" },
    ],
  };
}

async function readDemo(timeZone: string) {
  try {
    return JSON.parse(await readFile(demoFile, "utf8")) as BoardData;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    await mkdir(".data", { recursive: true });
    const board = demoBoard(timeZone);
    const temporary = `${demoFile}.${randomUUID()}`;
    await writeFile(temporary, JSON.stringify(board));
    try {
      await link(temporary, demoFile);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
      return JSON.parse(await readFile(demoFile, "utf8")) as BoardData;
    } finally {
      await unlink(temporary);
    }
    return board;
  }
}

async function readProduction() {
  const result = await get(pathname, {
    access: "private",
    useCache: false,
    headers: { "Accept-Encoding": "identity" },
    abortSignal: AbortSignal.timeout(10_000),
  });
  if (!result) return { board: { groceries: [], chores: [], schedule: [] } as BoardData };
  if (result.statusCode !== 200) throw new Error("Unexpected Blob response.");
  const board = await new Response(result.stream).json() as BoardData;
  // Blob's CDN can prefix the stored ETag with W/ for compressed GETs.
  // Its conditional write endpoint expects the original strong tag.
  const etag = result.blob.etag.replace(/^W\//, "");
  if (!etag) throw new Error("Missing Blob version.");
  return { board, etag };
}

export async function loadBoard(timeZone: string) {
  const board = demoMode ? await readDemo(timeZone) : (await readProduction()).board;
  const today = householdDate(timeZone);
  return {
    groceries: board.groceries,
    chores: [...board.chores].sort((a, b) => (a.due_on ?? "9999").localeCompare(b.due_on ?? "9999")),
    schedule: upcomingSchedule(board.schedule, today),
    weeklySchedule: board.schedule.filter((entry) => entry.repeat_on?.length),
    pastSchedule: board.schedule.filter((entry) => !entry.repeat_on?.length && entry.ends_at.slice(0, 10) < today)
      .sort((a, b) => b.starts_at.localeCompare(a.starts_at)),
  };
}

export async function updateData(timeZone: string, update: Update) {
  if (demoMode) {
    const pending = (local.householdWrite ?? Promise.resolve()).catch(() => {}).then(async () => {
      const board = await readDemo(timeZone);
      const error = update(board);
      if (error) return error;
      const pendingFile = `${demoFile}.${randomUUID()}`;
      await writeFile(pendingFile, JSON.stringify(board));
      await rename(pendingFile, demoFile);
    });
    local.householdWrite = pending;
    return pending;
  }

  for (let attempt = 0; attempt < 4; attempt++) {
    const { board, etag } = await readProduction();
    const error = update(board);
    if (error) return error;
    try {
      await put(pathname, JSON.stringify(board), {
        access: "private", contentType: "application/json",
        addRandomSuffix: false, allowOverwrite: Boolean(etag), ifMatch: etag,
      });
      return;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) continue;
      if (!etag && (await readProduction()).etag) continue;
      throw error;
    }
  }
  return "Someone else updated the board. Try again.";
}

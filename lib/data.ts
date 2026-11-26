import { neon } from "@neondatabase/serverless";
import type { PGlite } from "@electric-sql/pglite";
import { readFile } from "node:fs/promises";
import { demoMode } from "./config";

type Param = string | number | null;
type LocalState = typeof globalThis & { householdLocal?: Promise<PGlite> };
const local = globalThis as LocalState;

async function initLocal() {
  const { PGlite } = await import("@electric-sql/pglite");
  const db = await PGlite.create(".data");
  await db.exec(await readFile("schema.sql", "utf8"));
  await db.exec(`
    CREATE TABLE IF NOT EXISTS demo_seed (seeded boolean PRIMARY KEY);
    INSERT INTO groceries (id, name, quantity, status, claimed_by)
    SELECT id::uuid, name, quantity, status, claimed_by FROM (VALUES
      ('78a40000-0000-4000-8000-000000000001','Oat milk','2 cartons','buy',NULL),
      ('78a40000-0000-4000-8000-000000000002','Eggs','1 dozen','buy','jordan'),
      ('78a40000-0000-4000-8000-000000000003','Avocados','3','buy',NULL),
      ('78a40000-0000-4000-8000-000000000004','Rice','Keep 1 bag','maintain',NULL),
      ('78a40000-0000-4000-8000-000000000005','Olive oil','Keep 1 bottle','maintain',NULL),
      ('78a40000-0000-4000-8000-000000000006','Old yogurt','1 tub','remove',NULL)
    ) AS samples(id, name, quantity, status, claimed_by)
    WHERE NOT EXISTS (SELECT FROM demo_seed);
    INSERT INTO chores (id, name, assignee, due_on, reward_cents, status)
    SELECT id::uuid, name, assignee, CURRENT_DATE + days, reward, status FROM (VALUES
      ('78a40000-0000-4000-8000-000000000007','Take out recycling','sam',0,500,'open'),
      ('78a40000-0000-4000-8000-000000000008','Clean the kitchen',NULL,1,1500,'open'),
      ('78a40000-0000-4000-8000-000000000009','Water the plants','jordan',1,800,'done')
    ) AS samples(id, name, assignee, days, reward, status)
    WHERE NOT EXISTS (SELECT FROM demo_seed);
    INSERT INTO schedule (id, member_id, status, starts_at, ends_at, note)
    SELECT id::uuid, member_id, status, CURRENT_DATE + days + start_time::time,
      CURRENT_DATE + days + end_time::time, note FROM (VALUES
        ('78a40000-0000-4000-8000-000000000010','jordan','away',0,'09:00','17:00','Work'),
        ('78a40000-0000-4000-8000-000000000011','alex','home',0,'16:00','20:00',''),
        ('78a40000-0000-4000-8000-000000000012','sam','away',1,'10:00','13:00','Errands')
    ) AS samples(id, member_id, status, days, start_time, end_time, note)
    WHERE NOT EXISTS (SELECT FROM demo_seed);
    INSERT INTO demo_seed VALUES (true) ON CONFLICT DO NOTHING;
  `);
  return db;
}

export async function query<T>(sql: string, params: Param[] = []) {
  const url = process.env.DATABASE_URL;
  if (url) return await neon(url).query(sql, params) as T[];
  if (!demoMode) throw new Error("Database configuration is required.");
  const db = await (local.householdLocal ??= initLocal());
  return (await db.query<T>(sql, params)).rows;
}

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
};

export function loadBoard(timeZone: string) {
  return Promise.all([
    query<Grocery>("SELECT * FROM groceries ORDER BY created_at DESC, name"),
    query<Chore>(`SELECT id, name, assignee, due_on::text, reward_cents, status, paid_by,
      to_char(paid_at AT TIME ZONE $1, 'YYYY-MM-DD') AS paid_on
      FROM chores ORDER BY CASE status WHEN 'open' THEN 0 WHEN 'done' THEN 1 ELSE 2 END,
      due_on NULLS LAST, created_at DESC`, [timeZone]),
    query<ScheduleEntry>(`SELECT id, member_id, status,
      to_char(starts_at, 'YYYY-MM-DD"T"HH24:MI') AS starts_at,
      to_char(ends_at, 'YYYY-MM-DD"T"HH24:MI') AS ends_at, note
      FROM schedule WHERE ends_at >= (now() AT TIME ZONE $1)::date
      ORDER BY starts_at, member_id`, [timeZone]),
  ]);
}

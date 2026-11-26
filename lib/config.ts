import { z } from "zod";

const memberSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,32}$/),
  name: z.string().trim().min(1).max(40),
  key: z.string().min(32).max(256),
  manager: z.boolean().default(false),
});

const rosterSchema = z.array(memberSchema).min(1).max(20).refine(
  (members) => new Set(members.map((member) => member.id)).size === members.length
    && new Set(members.map((member) => member.key)).size === members.length
    && members.some((member) => member.manager),
);

export const demoMode = process.env.NODE_ENV === "development"
  && !process.env.VERCEL && !process.env.DATABASE_URL;

export const demoKeys = ["demo-alex-local-access-key-000000", "demo-jordan-local-access-key-0000", "demo-sam-local-access-key-0000000"];

const demoMembers = [
  { id: "alex", name: "Alex", key: demoKeys[0], manager: true },
  { id: "jordan", name: "Jordan", key: demoKeys[1], manager: false },
  { id: "sam", name: "Sam", key: demoKeys[2], manager: false },
];

export function getConfig() {
  const timeZone = process.env.HOUSEHOLD_TIME_ZONE || "America/New_York";
  const currency = process.env.HOUSEHOLD_CURRENCY || "USD";
  if (demoMode) {
    return { members: demoMembers, secret: "household-local-demo-secret-never-deploy", timeZone, currency };
  }
  const secret = process.env.HOUSEHOLD_SESSION_SECRET;
  if (!process.env.DATABASE_URL || !secret || secret.length < 32) return null;
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    const format = new Intl.NumberFormat("en", { style: "currency", currency });
    if (format.resolvedOptions().maximumFractionDigits !== 2) return null;
    const members = rosterSchema.parse(JSON.parse(process.env.HOUSEHOLD_MEMBERS || "[]"));
    return { members, secret, timeZone, currency };
  } catch {
    return null;
  }
}

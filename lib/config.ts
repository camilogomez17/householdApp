import { z } from "zod";

const memberSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]{1,32}$/),
  name: z.string().trim().min(1).max(40),
  manager: z.boolean().default(false),
});

const rosterSchema = z.array(memberSchema).min(1).max(20).refine(
  (members) => new Set(members.map((member) => member.id)).size === members.length
    && members.some((member) => member.manager),
);

const household = [
  { id: "owner", name: "Household manager", manager: true },
  { id: "mom", name: "Mom", manager: false },
  { id: "stepdad", name: "Stepdad", manager: false },
];

const demoMembers = [
  { id: "alex", name: "Alex", manager: true },
  { id: "jordan", name: "Jordan", manager: false },
  { id: "sam", name: "Sam", manager: false },
];

export const demoMode = process.env.NODE_ENV === "development"
  && !process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN;

export function getConfig() {
  const timeZone = process.env.HOUSEHOLD_TIME_ZONE || "America/New_York";
  const currency = process.env.HOUSEHOLD_CURRENCY || "USD";
  const secret = demoMode ? "household-local-demo-secret-never-deploy" : process.env.HOUSEHOLD_SESSION_SECRET;
  const hasStorage = process.env.BLOB_READ_WRITE_TOKEN || process.env.BLOB_STORE_ID;
  if (!secret || secret.length < 32 || (!demoMode && !hasStorage)) return null;
  try {
    new Intl.DateTimeFormat("en", { timeZone });
    const format = new Intl.NumberFormat("en", { style: "currency", currency });
    if (format.resolvedOptions().maximumFractionDigits !== 2) return null;
    const members = demoMode ? demoMembers : process.env.HOUSEHOLD_MEMBERS
      ? rosterSchema.parse(JSON.parse(process.env.HOUSEHOLD_MEMBERS)) : household;
    return { members, secret, timeZone, currency };
  } catch {
    return null;
  }
}

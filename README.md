# Household

Private Next.js board for shared groceries, chores and home/away schedules.

- **Groceries** — List what to buy, maintain or remove. Claim a purchase so two people do not buy the same item.
- **Chores** — Assign work, mark it complete and let a manager record a payout after paying outside the app.
- **Schedule** — Post your own home and away windows. The board uses one household time zone and refreshes when you return to the tab or every 30 seconds while it is visible.

## Run locally

Use Node.js 22 or later.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` and choose one of the example profiles. Without a database URL, development mode uses a persistent local Postgres-compatible database in the ignored `.data/` directory and adds example records. The demo never runs on Vercel or in production mode.

## Deploy on Vercel

1. Import this GitHub repository as a Next.js project.
2. Attach a Neon Postgres database and run [schema.sql](schema.sql) in its SQL editor. Use a separate database for any previews that need real sign-in.
3. Set the variables shown in [.env.example](.env.example) for the intended deployment. Use Neon’s `DATABASE_URL`. For `HOUSEHOLD_SESSION_SECRET` and each member's access key, generate separate values with `openssl rand -hex 32`. Set at least one member's `manager` flag to `true` and keep member IDs stable once used.
4. Choose a household IANA time zone and a two-decimal currency. Redeploy and give each member their own access key privately. Replacing a member’s key invalidates their existing sessions.

This MVP supports a single household per deployment. Members can see the same board. Managers can assign chores to others, set rewards, and record payments. Other members can claim unassigned work and complete their own chores. Any member can update the shared grocery lists. Each member manages their own schedule. An empty production database starts with an empty board.

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

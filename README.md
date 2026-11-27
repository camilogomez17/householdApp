# Household

Private Next.js board for shared groceries, chores and home/away schedules.

- **Groceries** — List what to buy, maintain or remove. Claim a purchase so two people do not buy the same item.
- **Chores** — Assign work, mark it complete and let a manager record a payout after paying outside the app.
- **Calendar** — Add events and yearly birthdays, and see one-time or weekly home and away windows. Times use the household time zone.
- **Meals** — Propose and vote on breakfast, lunch, and dinner each week. Members report availability and volunteer to cook; managers select the final dish. Ingredient lists are visible alongside the grocery board but do not automatically create purchases.
- **Lists** — Make shared checklists and add, edit, or check off items together. The board refreshes when you return to the tab and once a minute while it is visible.

## Using the board

Enter your personal access code on the homepage or open your personal household link. Either signs you in on that device. The household manager can find each member’s code in **Family links** or tap **Share link** next to their name. Send these privately because anyone who has a code or link can use that profile.

Managers can assign chores to others, set rewards and record payments. Other members can claim unassigned work and complete their own chores. Everyone can update shared groceries and manage their own home/away schedule. Payments take place outside the app.

## Run locally

Use Node.js 22 or later.

```bash
npm ci
npm run dev
```

Open `http://localhost:3000` and tap a demo profile. Local development without a Blob token uses sample data in the ignored `.data/` directory. The demo is disabled in hosted deployments.

## Hosting and maintenance

This project uses a private Vercel Blob store to save the board for all devices. It starts with an empty board and creates its data file on the first saved entry. Conditional writes prevent two updates from silently overwriting each other.

Vercel supplies `BLOB_READ_WRITE_TOKEN` when a private store is connected. Production also needs a sensitive `HOUSEHOLD_SESSION_SECRET`. If moving to a fresh deployment, generate the secret with `openssl rand -hex 32`. Generate the initial manager link using that secret in your shell:

```bash
node --env-file=.env.local -e 'const {createHmac}=require("node:crypto"); const secret=process.env.HOUSEHOLD_SESSION_SECRET; if(!secret || secret.length<32) throw Error("A session secret is required"); console.log("/join#owner."+createHmac("sha256",secret).update("invite:owner").digest("base64url"));'
```

Append that path to the site URL and keep the link private. Rotating the secret invalidates all previously issued links and sessions. Use a separate Blob store and secret if you enable sign-in in Preview. Optional roster, time zone and currency settings are documented in [.env.example](.env.example).

## Checks

```bash
npm run lint
npm run typecheck
npm run build
```

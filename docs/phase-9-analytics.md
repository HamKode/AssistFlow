# Phase 9 — Analytics Dashboard

Builds on Phases 1–5/8. The dashboard (`/dashboard`, already built in this
repo) reads directly from Airtable — no Make.com scenario needed for this
phase, since displaying data isn't automation. What Make.com *does* still
need is one new addition: **logging every conversation**, since nothing so
far has been saving a record of each chat turn (Phase 2/4 only wrote to
`Customers` and `Tickets`, not a full conversation log).

---

## Step 1 — Airtable: `Conversations` table

New table in the `AssistFlow` base:

| Field name | Type |
|---|---|
| Conversation ID | Single line text |
| Customer ID | Single line text |
| Message | Long text |
| Answer | Long text |
| Intent | Single line text |
| Category | Single line text |
| Priority | Single line text |
| Handoff | Checkbox |
| Lead | Checkbox |
| Created At | Created time (auto) |

---

## Step 2 — Log every conversation in Scenario 1

This needs to run for **every** message, regardless of which Phase 4
router branch fires — so it goes **before** the Router, not inside any of
its 4 routes (no cloning needed here, unlike the router branches).

1. In Scenario 1, find the connection between **Parse JSON** and the
   **Router** (Phase 4).
2. Click the `+` on that line → **Airtable → Create a Record**.
3. **Base**: `AssistFlow`, **Table**: `Conversations`.
4. Map fields:
   - `Conversation ID` = webhook's `conversation_id`
   - `Customer ID` = webhook's `customer_id`
   - `Message` = webhook's `message`
   - `Answer` = Parse JSON's `answer`
   - `Intent` = Parse JSON's `intent`
   - `Category` = Parse JSON's `category`
   - `Priority` = Parse JSON's `priority`
   - `Handoff` = Parse JSON's `handoff`
   - `Lead` = Parse JSON's `lead`
5. **OK** → **Save** → confirm the scenario is still **ON**.

---

## Step 3 — Airtable read-only token (for the dashboard, not Make.com)

This is a **separate token** from the one Make.com uses — scoped to
read-only, since the Next.js app only ever displays data, never writes.

1. Airtable → **Developer hub** → **Personal access tokens** → **Create
   token**.
2. Name: `AssistFlow Dashboard (read-only)`.
3. Scopes: `data.records:read` and `schema.bases:read` — **do not** add
   `data.records:write`.
4. Access: the `AssistFlow` base only.
5. **Create token** → copy it.

### Find your Base ID

Airtable → open the `AssistFlow` base → **Help** (top-right `?`) → **API
documentation** — the Base ID (starts with `app...`) is shown at the top.
Or: the base's URL itself is `https://airtable.com/appXXXXXXXXXXXXXX/...`
— that `appXXXXXXXXXXXXXX` segment is the Base ID.

---

## Step 4 — Connect the repo

In `.env.local`:

```
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX...
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
```

Run `npm run dev`, open http://localhost:3000/dashboard.

- If the env vars are missing, the page shows a friendly setup message
  instead of crashing (see `src/app/dashboard/page.tsx`).
- Once configured, it shows: Total Conversations, AI Resolved, Human
  Handoffs, AI Resolution Rate, Open Tickets, Customer Satisfaction (CSAT),
  plus Total/Resolved Tickets, Sales Leads, a Top Support Categories bar
  chart, and an Open vs. Resolved ticket status bar.

## Metrics reference

```
AI Resolution Rate = AI Resolved Conversations ÷ Total Conversations × 100
Customer Satisfaction (CSAT) = average(Rating) from the Feedback table, out of 5
```

`AI Resolved` = conversations where `Handoff = false`; `Human Handoffs` =
`Handoff = true`. Every number on the dashboard traces back to a real
Airtable row — nothing is mocked.

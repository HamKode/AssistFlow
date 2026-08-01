# Phase 4 — Make.com Router: Sales / Billing / Human Handoff

Builds on `docs/phase-1-make-groq-setup.md` and `docs/phase-2-knowledge-base.md`.
By the end of this phase, the same structured data Groq already returns
(`intent`, `category`, `priority`, `handoff`, `lead`) drives real side
effects: CRM tagging, ticket creation, and Slack/Email alerts — while the
customer still always gets their AI answer back immediately.

**Key idea:** the Router sits *after* Parse JSON and *before* the final
Webhook response. Filters aren't fully mutually exclusive (see the
Known overlap note below), and — important — **Make.com does not merge
multiple router branches back into one shared downstream module**; a
module can only have a single upstream connection. Each branch needs its
**own clone** of the Webhook response module at its end, not a dragged
connection into a shared one.

---

## Step 1 — Add a `Tickets` table in Airtable

In your existing `AssistFlow` Airtable base, add a new table `Tickets`:

| Field name | Type |
|---|---|
| Ticket ID | Autonumber |
| Customer Name | Single line text |
| Email | Single line text |
| Customer ID | Single line text |
| Conversation ID | Single line text |
| Issue | Long text |
| Category | Single line text |
| Priority | Single select (Low, Medium, High, Urgent) |
| Status | Single select (Open, In Progress, Waiting for Customer, Resolved, Closed) |
| Assigned Agent | Single line text |
| Created At | Created time (auto) |
| Updated At | Last modified time (auto) |
| Resolution | Long text |

---

## Step 2 — Add the Router

Between **Parse JSON** and **Webhook response**, insert a **Router**
(search "Router" in the `+` menu). Add 4 routes with these filters:

1. **Route: Human Handoff** — filter `handoff` = `true`
2. **Route: Sales Lead** — filter `handoff` = `false` AND `intent` = `sales`
3. **Route: Billing/Complaint** — filter `handoff` = `false` AND (`category` = `billing` OR `category` = `complaint`)
4. **Route: Normal Support** — filter `handoff` = `false` AND `intent` ≠ `sales` AND `category` ≠ `billing`/`complaint`

### ⚠️ Known overlap (accepted, not a bug)

A message can be `intent: sales` **and** `handoff: true` at the same time
(e.g. Groq doesn't know enterprise pricing, so it correctly refuses to
guess and sets `handoff: true`). With the filters above, that request only
matches **Route 1 (Human Handoff)** — Route 2's `handoff = false` condition
excludes it, so no `Hot Lead` tag gets applied in that case. In practice
this is an acceptable trade-off (Route 1 still creates a ticket, alerts
Slack `#support`, and emails the customer — the urgent case is still
handled) but if you want *every* sales-intent message to always tag `Hot
Lead` regardless of handoff, drop the `handoff = false` clause from Route
2's filter (Sales Lead) so it fires alongside Route 1 whenever `intent =
sales`, independent of handoff status.

---

## Step 3 — Sales Lead route

- **Airtable → Update a Record** on `Customers` table:
  - **Record ID**: use `{{ifempty(SearchRecords.id; CreateRecord.id)}}`
    (combine both tokens from Phase 2's customer-lookup modules — the
    customer might be brand new, so the ID could be coming from either
    branch)
  - `Tags` = add `Hot Lead` (multi-select — **pick from the dropdown**,
    never type free text into a multi-select field, and never leave it
    partially typed — Airtable rejects both with a 422)
  - `Customer Type` = `Lead`
- **Slack → Create a Message** (see Step 6 for connecting Slack) to your
  `#sales` channel: `🔥 New hot lead: {{name}} ({{email}}) — "{{message}}"`

## Step 4 — Billing/Complaint route

- **Airtable → Create a Record** on `Tickets`:
  - `Customer Name` = `{{name}}`, `Email` = `{{email}}`, `Customer ID` = `{{customer_id}}`,
    `Conversation ID` = `{{conversation_id}}`, `Issue` = `{{message}}`,
    `Category` = `{{category}}`, `Priority` = `{{priority}}`, `Status` = `Open`

## Step 5 — Human Handoff route

- Same **Airtable → Create a Record** on `Tickets` as Step 4 (Status = `Open`).
- **Slack → Create a Message** to `#support`:
  `🚨 URGENT SUPPORT TICKET\nCustomer: {{name}}\nIssue: {{message}}\nPriority: {{priority}}`
- **Gmail → Send an Email** to the customer's `{{email}}`:
  Subject: `We've received your request` — Body: "Hi {{name}}, your request
  has been forwarded to our support team. A support agent will assist you
  shortly."

## Step 6 — Connect Slack and Gmail

- **Slack**: add a Slack module → **Add** connection → Make redirects to
  Slack's OAuth login → authorize → pick your workspace and channel.
- **Gmail**: add a Gmail module → **Add** connection → Google OAuth login
  → authorize Make.com to send email as you.

## Step 7 — Give every route its own Webhook response

Right-click the existing **Webhook response** module → **Clone**, then
attach the clone to the end of each of the other 3 routes (Sales Lead,
Billing/Complaint, Normal Support — whichever one wasn't already
connected). All 4 clones use identical settings/body
(`{{answer}}`, `{{intent}}`, `{{category}}`, `{{priority}}`, `{{handoff}}`,
`{{lead}}`, `{{reason}}` — all sourced from Parse JSON, which sits
*upstream* of the Router, so every clone's tokens resolve correctly no
matter which route it's in). Since only one route fires per request,
only one clone actually runs — no conflict.

## Step 8 — Test

Verified working end-to-end via direct webhook `curl` calls:

- Normal support question → exact knowledge-base answer, no side effects.
- Sales inquiry ("interested in your enterprise plan") → `intent: sales`,
  `lead: true` (see the overlap note above re: `Hot Lead` tagging when
  handoff is also true).
- Billing complaint ("charged twice") → `category: billing`,
  `priority: high`, `handoff: true` → ticket created, Slack + email sent.
- Direct handoff request ("speak to a human agent") → `intent:
  human_support`, `priority: urgent`, `handoff: true` → ticket created,
  Slack + email sent.

### Errors hit while building this (and their real fixes)

- **Airtable 422 "Cannot parse value for field Tags"** — a multi-select
  field was mapped to an empty string. Fix: leave the field completely
  unmapped unless you're actually setting one of its real options via the
  dropdown.
- **"Couldn't find the id field for airtable:ActionUpdateRecords... ran
  with no record ID"** — an Update module referenced only the Search
  Records module's ID, which is empty for brand-new customers. Fix:
  `{{ifempty(SearchRecords.id; CreateRecord.id)}}`.
- **"Total records" doesn't exist as a field** — the correct token for
  "how many rows did Search Records find" is **`Total number of
  bundles`**, found at the top of that module's token list (above the
  individual record fields).
- **Router branches can't share one downstream module** — clone the
  module into each branch instead of trying to drag multiple connections
  into one.

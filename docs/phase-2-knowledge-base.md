# Phase 2 — Knowledge Base (Airtable) + Customer Lookup

Builds on top of `docs/phase-1-make-groq-setup.md`. By the end of this
phase, Groq's answers come from **your real company data**, not general
knowledge — and every message is tied to a real customer record.

We use **Airtable** (not Google Sheets) for this phase because Airtable's
Make.com module supports **filtered search** natively (Sheets' search is
clunkier for this), and Airtable doubles as the CRM base in later phases —
one tool, less to explain to a client.

---

## Step 1 — Build the Airtable base

1. https://airtable.com → sign up (free plan is enough) → **Create a base**
   → name it `AssistFlow`.
2. Rename the default table to **Knowledge Base**, with these fields:

| Field name | Type |
|---|---|
| Question | Single line text |
| Answer | Long text |
| Category | Single select (Returns, Shipping, Refunds, Support, Payment, Company) |

3. Add rows (from the original spec):

| Question | Answer | Category |
|---|---|---|
| What is your return policy? | Products can be returned within 30 days of purchase, unused and in original packaging. | Returns |
| How long is shipping? | Standard shipping takes 3-5 business days. | Shipping |
| How long do refunds take? | Refunds are processed within 7 business days after the returned item is received. | Refunds |
| What are support hours? | Support is available 9 AM - 6 PM, Monday to Friday. | Support |

4. Add a second table, **Customers**, with fields matching Section 13 of the
   spec:

| Field name | Type |
|---|---|
| Name | Single line text |
| Email | Single line text (used as the lookup key) |
| Phone | Phone number |
| Company | Single line text |
| Customer Type | Single select (Lead, Customer, VIP) |
| Tags | Multiple select |
| Total Conversations | Number |
| Total Tickets | Number |
| Open Tickets | Number |
| Last Contact | Date |
| Created Date | Created time (auto) |

5. Get your Airtable **Personal Access Token**: avatar (top-right) →
   **Developer hub** → **Personal access tokens** → **Create token** → give
   it `data.records:read` and `data.records:write` scopes, and access to
   the `AssistFlow` base → **Create token** → copy it (Make.com will ask
   for this when you connect the Airtable app).

---

## Step 2 — Insert a Customer Lookup module (in Make.com)

Back in your Scenario 1 (from Phase 1), between the **Webhook** module and
the **HTTP (Groq)** module:

1. Click the small **`+`** that appears on the connecting line between the
   two modules (hover over the line).
2. Search **Airtable** → **Search Records**.
3. Connect your Airtable account (paste the personal access token from
   Step 1).
4. **Base**: `AssistFlow`, **Table**: `Customers`.
5. **Formula**: `{Email} = '{{email}}'` (use the webhook's `email` token
   inside the quotes).
6. This returns 0 or 1 record. We'll branch on that next.

### Create-if-missing branch

Add a **Router** right after Search Records (Make's Router module, `+` →
search "Router"):

- **Route A ("New customer")** — filter: the Search Records module's
  **`Total number of bundles`** token (not "Total records" — that field
  doesn't exist; `Total number of bundles` is the correct meta-token Make
  exposes for search-type modules) **Equal to** `0` → add
  **Airtable → Create a Record** in table `Customers`, mapping
  `Name = {{name}}`, `Email = {{email}}`, `Customer Type = Lead`,
  `Total Conversations = 1`, `Last Contact = now`.
- **Route B ("Existing customer")** — filter: `Total number of bundles`
  **Greater than** `0` → add **Airtable → Update a Record**. Leave the
  **Tags** field completely unmapped here (an empty/typed value on a
  multi-select field makes Airtable reject the write with a 422 — Tags
  only ever gets set later, in the Sales Lead router branch). Increment
  `Total Conversations` and set `Last Contact = now`.

**Important — do not leave `Tags` mapped with any value in this module.**
This "new or existing customer" step is not where `Hot Lead` gets applied
(that's the Router's Sales Lead branch, built in a later phase) — an empty
or stray mapping here will make every single request fail with an Airtable
422, even completely unrelated support questions, because this branch runs
on *every* incoming message.

**Downstream modules that need "whichever record this customer is" (its
Airtable Record ID) must combine both branches**, since only one of them
ran: use `{{ifempty(SearchRecords.id; CreateRecord.id)}}` (pick both `id`
tokens from the token picker; this typed formula just falls back to the
freshly-created record's ID when the search found nothing).

**Make.com does not let you drag multiple routes into one shared
downstream module** (a module can only have one upstream connection) —
so to continue both routes into the same next steps (the knowledge base
search, and everything after it), **clone the downstream module chain
into each route** (right-click → Clone, then connect the clone to that
route) rather than trying to merge the connections visually.

---

## Step 3 — Knowledge Base search

After the customer lookup (both routes), add:

1. **`+`** → **Airtable** → **Search Records**.
2. **Base**: `AssistFlow`, **Table**: `Knowledge Base`.
3. For the MVP we don't have real full-text search in Airtable's free API
   filter, so keep it simple and pull **all rows** (leave formula empty, or
   use `{Category}` filtering later once you have many rows) — Make will
   return an array of `{Question, Answer, Category}` records. With only a
   handful of FAQ rows this is fine and cheap; Groq does the actual
   matching by reading all of them in the prompt.

---

## Step 4 — Feed the knowledge base into the Groq prompt

Open your existing **HTTP (Groq)** module from Phase 1 and change the
`user` message so it includes the knowledge base content, using Make's
**`join()`** function to turn the Airtable array into text. In the
`content` field of the `user` message, use:

```
Knowledge base:
{{join(map(SearchRecords2.array; "Question"); "\n")}}
{{join(map(SearchRecords2.array; "Answer"); "\n")}}

Customer question: {{message}}
```

In practice, Make's formula editor makes this easier as a small function
chain than typing it raw — the important part conceptually is:

1. Loop over every knowledge base row.
2. Format each as `Q: ... / A: ... / Category: ...`.
3. Join them with newlines into one block of text.
4. Put that block into the system/user message **before** the customer's
   actual question, so Groq only answers from what's there (per the system
   prompt's Rule 1 and 4).

A cleaner way that avoids fiddly array functions: add an **Array Aggregator**
module (search "Array aggregator" in Make) right after the Knowledge Base
search, with:
- **Source module**: the Knowledge Base Search Records module
- **Target field to aggregate**: leave as "text", but check **"Aggregate to
  Text"** and use a custom row template:
  `Q: {{Question}} | A: {{Answer}} | Category: {{Category}}`
- Row separator: newline (`\n`)

This produces one clean `Text` token you can drop straight into the Groq
`user` message:

```
Knowledge base:
{{ArrayAggregator.text}}

Customer question: {{message}}
```

Update the system prompt slightly to make the source explicit:

> "...using only verified company information provided in the knowledge
> base below the line 'Knowledge base:'. If the customer's question isn't
> covered there, do not guess — set handoff to true and say you'll connect
> them with a human agent who can help."

---

## Step 5 — Re-test

1. **Run once** on the scenario.
2. From the running Next.js app (`npm run dev`), ask **"What is your return
   policy?"** in the chat widget — the answer should now be the exact
   30-day policy text from your Airtable row, not a generic AI guess.
3. Ask something **not** in the knowledge base (e.g. "Do you ship to Mars?")
   — `handoff` should come back `true` and the widget should show the
   "connecting you with an agent" banner (already built into the frontend).

---

## What's next

- **Phase 3** is already done — Groq's structured JSON output already
  returns `intent`, `category`, `priority`, `handoff`, `lead` (built in
  Phase 1's prompt).
- **Phase 4**: add the Make.com **Router** after this HTTP+Parse JSON block
  to branch into Normal Support / Sales Lead / Billing-Complaint / Human
  Handoff routes, each doing its own Airtable/Ticket/Slack/Email actions.

# Phase 5+8 — Ticket Resolution & Customer Feedback (CSAT)

Builds on Phases 1, 2, and 4. Two new pieces:

1. **Scenario 4 (from the original spec)** — when a ticket's `Status`
   becomes `Resolved`, email the customer a resolution notice with 5
   clickable star-rating links.
2. **A new Feedback webhook scenario** — when a customer clicks a star
   link (or submits an optional written comment on `/feedback`), save it
   to Airtable.

The frontend half (`/feedback` page, `/api/feedback` route) is already
built in this repo — this doc is only the Make.com + Airtable side.

---

## Step 1 — Airtable: `Feedback` table + a `Feedback Requested` flag

**New table `Feedback`:**

| Field name | Type |
|---|---|
| Ticket ID | Single line text |
| Conversation ID | Single line text |
| Customer ID | Single line text |
| Rating | Number (1-5) |
| Feedback | Long text |
| Date | Created time (auto) |

**On the existing `Tickets` table**, add one field:

| Field name | Type |
|---|---|
| Feedback Requested | Checkbox |

This prevents the resolution email from firing more than once if the
ticket row gets touched/updated again after being resolved (Make's
"Watch Records" trigger fires on every update to a watched view, not just
the first time `Status` becomes `Resolved`).

---

## Step 2 — New scenario: "Feedback Webhook → Airtable"

Build this one first since Scenario 4 will link to `/feedback` URLs that
depend on it existing (though functionally they're independent — order is
just for convenience).

1. **Create a new scenario** (separate from Scenario 1) → add **Webhooks
   → Custom webhook** → name it `AssistFlow Feedback` → copy its URL.
2. This is what goes into `.env.local` as `MAKE_FEEDBACK_WEBHOOK_URL` (see
   Step 5).
3. Send a test payload to generate the structure:

```bash
curl -X POST https://hook.usX.make.com/YOUR_FEEDBACK_WEBHOOK \
  -H "Content-Type: application/json" \
  -d '{"ticket_id":"1","conversation_id":"conv1","customer_id":"c1","rating":5,"feedback":"Great support!"}'
```

4. Add **Airtable → Search Records** on table `Feedback`, formula:
   `{Ticket ID} = '{{ticket_id}}'` — this checks whether a feedback row
   already exists for this ticket (the rating click creates it; a later
   written comment should update the same row, not create a second one).
5. Add a **Router** with 2 routes:
   - **"No existing feedback row"** — filter: `Total number of bundles`
     (from Search Records) **Equal to** `0` → **Airtable → Create a
     Record** on `Feedback`: map `Ticket ID`, `Conversation ID`,
     `Customer ID`, `Rating` from the webhook tokens, and `Feedback` from
     the webhook's `feedback` token (empty on the first rating-only call).
   - **"Existing feedback row"** — filter: `Total number of bundles`
     **Greater than** `0` → **Airtable → Update a Record**: **Record ID**
     = `{{ifempty(SearchRecords.id; CreateRecord.id)}}` (same pattern as
     Phase 2/4 — falls back to the just-created record's ID on the very
     first call), updating `Feedback` (and `Rating`, in case it changes).
6. Clone a **Webhook response** module (status `200`, body
   `{"success": true}`) into the end of **both** routes (same reasoning as
   Phase 4 — Make can't merge branches into one shared module).
7. **Save**, turn the scenario **ON**.

---

## Step 3 — Scenario 4: "Ticket Resolved → Email + Feedback Request"

1. **Create another new scenario** → add **Airtable → Watch Records**
   (trigger, not Search Records) on table `Tickets`, watching the default
   view, sorted by `Updated At`.
2. Add a **Filter** right after the trigger:
   `Status` **Equal to** `Resolved` **AND** `Feedback Requested`
   **Equal to** `false` (unchecked).
3. Add **Gmail → Send an Email**:
   - **To**: `{{Email}}` (from the Tickets row)
   - **Subject**: `Your support ticket #{{Ticket ID}} has been resolved`
   - **Content** (HTML, so the stars are clickable links — the live
     deployed domain is `assist-flow-chat.vercel.app`):

```html
<p>Hi {{Customer Name}},</p>
<p>Your support ticket has been resolved: {{Resolution}}</p>
<p>How was your experience? Tap a star:</p>
<p>
  <a href="https://assist-flow-chat.vercel.app/feedback?ticket={{Ticket ID}}&conversation={{Conversation ID}}&customer_id={{Customer ID}}&rating=1">★</a>
  <a href="https://assist-flow-chat.vercel.app/feedback?ticket={{Ticket ID}}&conversation={{Conversation ID}}&customer_id={{Customer ID}}&rating=2">★★</a>
  <a href="https://assist-flow-chat.vercel.app/feedback?ticket={{Ticket ID}}&conversation={{Conversation ID}}&customer_id={{Customer ID}}&rating=3">★★★</a>
  <a href="https://assist-flow-chat.vercel.app/feedback?ticket={{Ticket ID}}&conversation={{Conversation ID}}&customer_id={{Customer ID}}&rating=4">★★★★</a>
  <a href="https://assist-flow-chat.vercel.app/feedback?ticket={{Ticket ID}}&conversation={{Conversation ID}}&customer_id={{Customer ID}}&rating=5">★★★★★</a>
</p>
```

   Each link's `rating=N` is what `/feedback` reads and auto-submits on
   load (see `src/components/feedback-form.tsx`).

4. Add **Airtable → Update a Record** on `Tickets`: same record, set
   `Feedback Requested` = checked (`true`). This is what stops the email
   from re-sending on every future edit to this ticket.
5. **Save**, turn the scenario **ON**.

---

## Step 4 — Production URL + env vars

The site is live at **https://assist-flow-chat.vercel.app** — the email
template in Step 3.3 already points there. Make sure Vercel's Environment
Variables (Project → Settings → Environment Variables) include
`MAKE_WEBHOOK_URL`, `MAKE_FEEDBACK_WEBHOOK_URL`, `AIRTABLE_API_KEY`, and
`AIRTABLE_BASE_ID` — without these the site silently falls back to its
safe error states (see `docs/phase-1-make-groq-setup.md` Step 6 and
`docs/phase-9-analytics.md` Step 4 for what each one is).

## Step 5 — Connect the repo

```
MAKE_FEEDBACK_WEBHOOK_URL=https://hook.usX.make.com/YOUR_FEEDBACK_WEBHOOK
```

in `.env.local`, then `npm run dev` and test:

1. In Airtable, manually create a `Tickets` row (or resolve one from
   Phase 4's ticket-creating tests), set `Status = Resolved`.
2. Check the resolution email arrives with 5 star links.
3. Click a star → `/feedback` should show filled stars, then a "Thanks!
   Want to add a comment?" box.
4. Submit a comment → check Airtable's `Feedback` table has one row (not
   two) with both the rating and the comment.

## CSAT math (for the future Analytics phase)

```
Average CSAT = sum(Rating) / count(Rating)   (out of 5)
```

This is exactly what Phase 9's dashboard will pull from the `Feedback`
table.

# Phase 1 — Make.com Scenario 1: AI Customer Support (with Groq)

This is the tutorial for the **first, most important piece of automation**:
Website → Make.com Webhook → Groq AI → JSON response → back to the website.

Everything in this file happens **outside this repo**, in your browser, inside
your Make.com and Groq accounts. The Next.js app (already built in `src/`)
is ready to talk to whatever webhook URL you create here.

Why Groq instead of OpenAI? Groq's API is **byte-for-byte compatible** with
OpenAI's Chat Completions API — same JSON shape, same `Authorization: Bearer`
header — it just uses a different base URL (`https://api.groq.com/openai/v1`)
and different model names (Llama models instead of GPT models), and it's
free/very cheap and extremely fast. So anywhere a Make.com tutorial says
"add an OpenAI module," we do the same thing with a plain **HTTP module**
pointed at Groq instead. This also means: no dedicated Make.com "OpenAI"
app connection to manage — one HTTP module, one API key.

---

## Step 0 — Accounts you need

1. **Make.com** — https://www.make.com → Sign up (free plan is enough to build and test this).
2. **Groq** — https://console.groq.com → Sign up → left sidebar **API Keys** →
   **Create API Key** → copy it immediately (shown once). Save it somewhere
   safe temporarily (you'll paste it into Make.com in Step 3, then can forget it).

Model to use: `llama-3.3-70b-versatile` (best quality/reasoning for support
answers). If you want something faster/cheaper for high volume, use
`llama-3.1-8b-instant` instead — same setup, just change the `model` field.

---

## Step 1 — Create the scenario and the Custom Webhook

1. Make.com dashboard → **Create a new scenario**.
2. Click the big **`+`** to add the first module → search **Webhooks** →
   choose **Custom webhook**.
3. Click **Add** next to "Webhook" dropdown → name it e.g. `AssistFlow Chat`
   → **Save**.
4. Make.com now shows you a unique URL like
   `https://hook.eu2.make.com/xxxxxxxxxxxxxxxxxxxxxxxx`. **Copy this URL.**
   This is what goes into this repo's `.env.local` as `MAKE_WEBHOOK_URL`
   (see Step 6).
5. Click **Redetermine data structure** (or just **OK**) — leave it for now,
   we'll generate the structure by sending a real test request from our app
   in a minute. Click the module's **round record icon** to put the webhook
   into "listening" mode.

> **Why our own `/api/chat` route calls this webhook instead of the browser
> calling it directly:** the webhook URL itself isn't secret, but routing
> through our own Next.js server (`src/app/api/chat/route.ts`, already
> built) lets us validate input, add a timeout, and return a safe fallback
> message if Make.com or Groq is ever down — instead of the customer seeing
> a raw network error. See Section 25 ("Error Handling") of the original
> spec — this is already implemented.

### Send a test payload to generate the data structure

With the webhook "listening" (from the previous step), open a terminal and
run (replace the URL with yours):

```bash
curl -X POST https://hook.eu2.make.com/xxxxxxxxxxxxxxxxxxxxxxxx \
  -H "Content-Type: application/json" \
  -d '{"customer_id":"c1","name":"Ahmed","email":"ahmed@example.com","conversation_id":"conv1","message":"What is your return policy?","request_human":false}'
```

Make.com will capture this and auto-generate the webhook's data structure
(you'll see fields `customer_id`, `name`, `email`, `conversation_id`,
`message`, `request_human` available as tokens in later modules). Click
**OK** in Make.com to confirm the structure.

---

## Step 2 — (Skip for now) Customer + Knowledge Base lookup

Those two modules (Airtable customer search, Airtable/Sheets knowledge base
search) are **Phase 2** — covered in `docs/phase-2-knowledge-base.md`. For
Phase 1, we go straight from the webhook to Groq so you have a working,
demoable pipeline fast, per the project's own "build in phases" rule. You'll
insert the two lookup modules between the webhook and the HTTP/Groq module
once Phase 2 is done — nothing here needs to be rebuilt.

---

## Step 3 — Add the HTTP module that calls Groq

1. Click the **`+`** after the webhook module → search **HTTP** → choose
   **Make a request**.
2. Fill in:
   - **URL**: `https://api.groq.com/openai/v1/chat/completions`
   - **Method**: `POST`
   - **Headers** (click "Add item" twice):
     - `Authorization` → `Bearer YOUR_GROQ_API_KEY`
     - `Content-Type` → `application/json`
   - **Body type**: `Raw`
   - **Content type**: `JSON (application/json)`
   - **Request content** — paste this, replacing the last line with the
     webhook's `message` token (click into the field and pick
     `message` from the webhook module's token picker instead of typing it):

```json
{
  "model": "llama-3.3-70b-versatile",
  "temperature": 0.3,
  "response_format": { "type": "json_object" },
  "messages": [
    {
      "role": "system",
      "content": "You are AssistFlow AI, an intelligent customer support assistant. Your job is to help customers using only verified company information provided in the knowledge base. Rules: 1. Never invent company policies. 2. Do not make up information. 3. Give concise and professional answers. 4. If the answer exists in the knowledge base, use it. 5. If you do not know the answer, do not hallucinate — say you'll connect them with a human instead. 6. If the customer requests a human agent, set handoff to true. 7. If the issue is sensitive, complex, urgent, or requires manual investigation, set handoff to true. 8. Detect the customer's intent (one of: support, sales, billing, refund, shipping, technical_issue, complaint, human_support). 9. Detect a support category. 10. Determine ticket priority (low, medium, high, urgent). 11. Detect potential sales leads. 12. Maintain a professional and friendly tone. You must respond with ONLY a JSON object with these exact keys: answer (string), intent (string), category (string), priority (string), handoff (boolean), lead (boolean), reason (string)."
    },
    {
      "role": "user",
      "content": "{{message}}"
    }
  ]
}
```

   Replace `{{message}}` with the actual token from the webhook module (Make
   inserts it as a blue pill when you click the field and select it — don't
   leave it as literal text).

3. Why `response_format: { "type": "json_object" }`: this tells Groq to
   guarantee the model's reply is valid JSON (no stray text, no markdown
   fences around it) — critical, because the next module parses it
   automatically. Without this, the model sometimes wraps JSON in
   ` ```json ... ``` ` and parsing breaks.
4. Click **OK** to save the module, then run the scenario once (bottom-left
   **Run once** button) — it will use the test payload structure from Step 1.
   Check the HTTP module's output bundle; you should see a `200` status and
   a `data` field containing the raw Groq response.

---

## Step 4 — Parse Groq's JSON response

Groq's HTTP response wraps the model's answer inside
`choices[0].message.content` (a string containing the JSON your prompt
asked for) — that string itself needs a second parse.

1. Click **`+`** after the HTTP module → search **JSON** → **Parse JSON**.
2. **JSON string**: click the field, and from the HTTP module's output,
   select `choices[] > message > content` (Make lets you drill into the
   array — pick item `1`).
3. Click **OK**. Make.com will ask to determine the structure — since this
   is dynamic, either paste a sample matching your prompt's schema:

```json
{"answer":"You can return products within 30 days.","intent":"support","category":"returns","priority":"medium","handoff":false,"lead":false,"reason":"Answered directly from knowledge base."}
```

Now `answer`, `intent`, `category`, `priority`, `handoff`, `lead`, and
`reason` are all available as individual tokens for every module downstream
— this is what powers the Router in Phase 4.

---

## Step 5 — Respond to the webhook

1. Click **`+`** after the Parse JSON module → search **Webhooks** →
   **Webhook response**.
2. **Status**: `200`
3. **Body** (Content-Type `application/json`):

```json
{
  "answer": "{{answer}}",
  "intent": "{{intent}}",
  "category": "{{category}}",
  "priority": "{{priority}}",
  "handoff": {{handoff}},
  "lead": {{lead}},
  "reason": "{{reason}}"
}
```

   (Again — use the token picker for each `{{...}}`, don't type them as
   plain text; Make needs them bound to the actual Parse JSON module
   outputs.)

4. Click **OK**, then **Save** the whole scenario (bottom toolbar), and
   toggle the scenario **ON** (top-right switch) so it keeps listening even
   when you close the browser tab.

This completes the loop your Next.js `src/app/api/chat/route.ts` expects:
POST in → `{ answer, intent, category, priority, handoff, lead, reason }`
out.

---

## Step 6 — Connect it to this repo

1. Copy the webhook URL from Step 1.
2. In the project root, create `.env.local` (copy `.env.example`):

```bash
cp .env.example .env.local
```

3. Set:

```
MAKE_WEBHOOK_URL=https://hook.eu2.make.com/xxxxxxxxxxxxxxxxxxxxxxxx
```

4. Run the app locally:

```bash
npm run dev
```

5. Open http://localhost:3000, click the chat bubble, fill in your name/email,
   and ask: **"What is your return policy?"** — you should get a real
   Groq-generated answer within a couple of seconds.

6. **For the deployed (Vercel) version**: add the same `MAKE_WEBHOOK_URL` as
   an environment variable in the Vercel project settings (Project →
   Settings → Environment Variables) — never commit `.env.local`, it's
   already git-ignored.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Widget always shows the "having trouble" fallback | `MAKE_WEBHOOK_URL` missing/wrong, or scenario is OFF | Check `.env.local`, check the scenario toggle is ON in Make.com |
| Make.com scenario errors on the HTTP module | Wrong/expired Groq key, or model name typo | Regenerate the key in console.groq.com; confirm `model` is exactly `llama-3.3-70b-versatile` |
| Parse JSON module fails | Groq didn't return pure JSON | Confirm `response_format: {"type":"json_object"}` is in the HTTP body, and that the system prompt explicitly says "respond with ONLY a JSON object" |
| Webhook response body shows literal `{{answer}}` text instead of the value | You typed the token instead of picking it from the picker | Delete the field content and re-insert using Make's blue-pill token picker |

---

## What's next

- **Phase 2**: swap the hard-coded system prompt's "knowledge base" trust
  with a real Airtable/Google Sheets lookup, injected into the prompt before
  it reaches Groq. See `docs/phase-2-knowledge-base.md`.
- **Phase 3/4**: the `intent`/`category`/`priority`/`handoff`/`lead` fields
  you're already getting back are exactly what the Make.com **Router**
  (Phase 4) branches on — no rework needed here.

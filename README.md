# AssistFlow — AI Customer Support Automation Platform

AI-powered customer support that automates conversations, tickets, CRM, and
human handoff. The website/chat widget is a Next.js app (this repo); all
automation logic (AI calls, CRM, tickets, email, Slack, routing) lives in
**Make.com** scenarios, per the project's core requirement — this repo is
intentionally "thin," it's a customer interface in front of the automation
engine.

## Stack

- **Frontend**: Next.js (App Router) + Tailwind — landing page + floating
  chat widget (`src/components/chat-widget.tsx`)
- **Automation engine**: Make.com scenarios
- **AI**: Groq (Llama models, OpenAI-compatible API) — not OpenAI
- **Knowledge base / CRM / tickets**: Airtable
- **Notifications**: Gmail, Slack (via Make.com)

## Local development

```bash
npm install
cp .env.example .env.local   # then set MAKE_WEBHOOK_URL (see docs/phase-1)
npm run dev
```

Open http://localhost:3000. Until `MAKE_WEBHOOK_URL` points at a real
Make.com scenario, the chat widget still works end-to-end — it just falls
back to a safe "connecting you with an agent" message (see
`src/app/api/chat/route.ts`).

## How the pieces fit together

```
Browser (chat-widget.tsx)
  → POST /api/chat (this repo, keeps the Make.com webhook URL server-side)
    → Make.com Custom Webhook
      → Airtable: customer lookup / create
      → Airtable: knowledge base search
      → HTTP module → Groq (llama-3.3-70b-versatile)
      → Parse JSON (answer, intent, category, priority, handoff, lead, reason)
      → Router → CRM update / Ticket creation / Slack / Email
      → Webhook response → back to /api/chat → browser
```

## Build order (do not build everything at once)

This project is intentionally built in phases — each is independently
demoable:

| Phase | What | Docs |
|---|---|---|
| 1 | Basic chat: webhook → Groq → response | [docs/phase-1-make-groq-setup.md](docs/phase-1-make-groq-setup.md) |
| 2 | Knowledge base (Airtable) + customer lookup | [docs/phase-2-knowledge-base.md](docs/phase-2-knowledge-base.md) |
| 3 | Intent/category/priority/handoff detection | done as part of Phase 1's structured prompt |
| 4 | Make.com Router (Support / Sales / Billing / Handoff) + tickets + Slack/Email | [docs/phase-4-router.md](docs/phase-4-router.md) |
| 5 | Ticket system (Airtable) + resolution workflow | [docs/phase-5-8-feedback.md](docs/phase-5-8-feedback.md) |
| 6 | CRM automation (tags, history, leads) | partially done (create/update + `Hot Lead` tag in Phase 4); deeper history/segmentation still open |
| 7 | Email + Slack notifications | done (Phase 4 alerts + Phase 5 resolution email) |
| 8 | Customer feedback / CSAT | [docs/phase-5-8-feedback.md](docs/phase-5-8-feedback.md) |
| 9 | Analytics dashboard | next |
| 10 | Polish: error handling, responsive UI, docs | ongoing |

Phases 1, 2, 4, 5, and 8 are built and documented. Later phases follow the same pattern:
extend the one Make.com scenario (or add new ones per the original spec's
Scenario 2–6 breakdown), and the frontend generally doesn't need to change
since the `/api/chat` contract (`answer`, `intent`, `category`, `priority`,
`handoff`, `lead`, `reason`) already carries everything the router needs.

## Security notes

- `MAKE_WEBHOOK_URL` is read server-side only (`src/app/api/chat/route.ts`),
  never exposed to the browser.
- The Groq API key lives **inside the Make.com scenario**, never in this
  repo or in any environment variable here.
- `.env.local` is git-ignored; only `.env.example` (no real values) is
  committed.

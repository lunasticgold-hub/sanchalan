# Sanchalan — Intelligent Event Command Center

**Kaun Banega Codepati 2026 · Problem ID KBC-NOTION-03 (Kinetex Lab × Notion)**

Sanchalan is an ops console for running real-world events. Organizers type a
natural-language ops update ("Move all sessions from Main Audi to Outdoor
Plaza"), the app parses it, **simulates the blast radius** with a pure
dependency engine (venue moves, capacity overflow, volunteer shift conflicts,
stale task references), and then **writes everything to 7 live Notion
databases** — sessions updated, tasks rewritten, comms drafts created, impact
reports filed. Every AI-generated record carries a `🤖 AI-generated` Source
tag (amber badge) vs `✅ Verified` (green) so judges can see exactly what the
AI touched.

## Setup

```bash
npm install
cp .env.example .env   # fill in tokens below
npm run dev            # frontend at http://localhost:5173
```

On Vercel, `/api/*.ts` deploy as serverless functions next to the static build —
no adapter needed.

### Environment

| Var | Required | Purpose |
|---|---|---|
| `NOTION_TOKEN` | yes (for live mode) | Notion integration token with access to the 7 databases |
| `GEMINI_API_KEY` | no | Gemini 2.5 Flash for NL parsing; keyword fallback otherwise |
| `VITE_DEMO_MODE` | no | informational only |

Database IDs live in `src/config.ts` → `DB_IDS` (already filled). Without
`NOTION_TOKEN`, the app runs on realistic mock data bannered **DEMO DATA**.

## 5-step demo script

1. **Dashboard walkthrough** — Open the app. Point out: stat cards, session
   timeline, task list with status filters, role switcher (Ops lead /
   Volunteer lead / Leadership changes visible panels), provenance badges on
   AI-touched records.
2. **Venue-change blast radius** — Go to *Log ops update*, type
   `Move all sessions from Main Audi to Outdoor Plaza`, hit **Parse** →
   **Simulate impact**. Show: 2 sessions moved, capacity check
   (Outdoor Plaza 500 ≥ 200 ✓ no overflow), tasks mentioning "Main Audi"
   rewritten, volunteers flagged, WhatsApp comms draft auto-created, impact
   report drafted. Then try `Move all sessions from Main Audi to Seminar
   Hall B` to trigger the **P0 capacity overflow** (120 < 200) + P0 task.
3. **Apply to Notion** — Hit **Apply to Notion**. With `NOTION_TOKEN` set,
   show the returned Notion page URLs; without it, the app explains exactly
   what *would* be written (updates + creates listed per database).
4. **Ask with citations** — Go to *Ask*, type `Which volunteers are on stage
   duty?` or `What is blocking the keynote?`. Answers cite the exact records
   (`sessions/…`, `tasks/…`).
5. **Time-shift conflict detection** — Back in *Log ops update*, type
   `Delay everything by 4 hours`, **Parse** → **Simulate impact**. Show the
   P1 volunteer shift conflicts (Morning-shift volunteers now outside their
   window) and the auto-created reconfirmation tasks. Close by opening the
   Notion parent page to prove the databases are the system of record.

## Architecture

```
src/config.ts      DB IDs + exact Notion property names (single source of truth)
src/lib/mock.ts    Demo dataset: BBSR Founders Meetup #1 (2026-10-10)
src/lib/engine.ts  PURE dependency engine: applyVenueChange / applyTimeShift
api/_schema.ts     Notion property-type map + flat-record converters
api/parse.ts       NL → structured change (Gemini 2.5 Flash, keyword fallback)
api/query.ts       Notion DB → flat records (501 without token)
api/apply.ts       ImpactPlan → Notion writes (501 without token)
api/ask.ts         Keyword RAG over records with citations
src/App.tsx        Ops-console UI: dashboard, ops flow, ask
```

Notion schema: **Sanchalan · Venues / Events / Sessions / Volunteers / Tasks /
Comms Log / Impact Reports** — see `src/config.ts` for exact property names.

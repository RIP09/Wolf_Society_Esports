# 📋 Wolf Society Esports — Practice & Scrim Scheduling Proposal (v1)

**Status:** ✅ Approved & implemented in this repository (Schedule Hub shipped to The Den, The Pack, and the public portal).
**Owner:** Wolf Society Esports management (The Den)
**Stack:** Convex (database + realtime subscriptions) · React/Vite · existing email/SMS/Discord pipes

---

## 1. Executive summary

Most esports orgs — amateur through semipro — run their practice and scrim operations on
Discord messages that get buried and shared spreadsheets nobody updates. Community threads
(r/esports) repeatedly describe this exact failure mode: *"Discord messages getting buried +
spreadsheet chaos."*

**The fix delivered here:** a **Schedule Hub** inside the Wolf Society website. Management
(The Den) controls a weekly routine template + a scrim board; players (The Pack) confirm
attendance and see their week in real time; every event fires **real** email, SMS and Discord
deliveries through the platform's existing notification pipes. Everything is live data — no
polling, no simulation, no paid tool.

## 2. What was built (2 modules)

### Module A — Daily Routine Scheduler (internal)

Staff sets the org's weekly template once: practice windows, VOD review, physical training,
content days, team meetings, rest days.

| Who | What they see / do |
|---|---|
| **Super Admin / Manager / Coach** (The Den → Schedule Hub) | Create weekly recurring blocks (per day of week + start time), assign to a team or all teams, set game, duration, location, required/optional |
| **Players** (The Pack → My Schedule) | 7-day live schedule of blocks that apply to *their* team + game; one-tap **Confirm / Maybe / Can't make**; sees teammate confirmations update live |
| **Automation** | Block created/updated → org email + Discord ping (real REST calls, recorded in the `notifications` outbox) |

### Module B — Scrim Scheduling (vs other teams)

- **Scrim board** in The Den: create scrim slots (game, team, opponent name + contact, date/time, duration, Bo1/Bo3/Bo5 format, notes)
- **Booking workflow:** `proposed → confirmed → completed / cancelled`, stored in Convex like tournament entries
- **Player notification:** confirming a scrim emails every active player on the roster; players with a phone number on file get an SMS too; org + Discord get the update
- **Auto-reminder:** a scheduled Convex job fires **3 hours before** a confirmed scrim → email + SMS + Discord to the roster (skips automatically if the scrim was cancelled)
- **Scrim history:** results logged (W/L/D + scores + VOD link) → becomes realtime analytics in The Den (record W–L–D) and public results on the site
- **Public page:** `/schedule` shows confirmed upcoming scrims + recent results so other orgs can find Wolf Society — with a "scrim us" path to /contact

## 3. Data model (Convex tables added)

```
routineBlocks           weekly recurring block: title, type, game, teamId?, dayOfWeek,
                        startHour, startMinute, durationMin, location?, required, createdBy
routineConfirmations    player response per concrete session: blockId, playerId, date,
                        status (confirmed | declined | maybe)
scrims                  scrim slot: title, game, teamId?, opponentName, opponentContact?,
                        scheduledAt, durationMin, format?, status, result?, scoreUs?,
                        scoreThem?, vodUrl?, notes?, createdBy
players                 + phone (optional) — enables real SMS reminders to players
```

All queries are reactive Convex subscriptions — the moment a player confirms attendance,
The Den's attendance column updates instantly; the moment a result is logged, the public
page updates.

## 4. Integrations (all free, all real — reused from the existing stack)

| Pipe | Key | Used for |
|---|---|---|
| Email — Resend | `RESEND_API_KEY` | Routine updates, scrim confirm/cancel/result/reminder emails to org + players |
| SMS — Vonage | `VONAGE_API_KEY`, `VONAGE_API_SECRET` | SMS reminders to players with a phone on file + org updates |
| Discord | `DISCORD_WEBHOOK_URL` | Every routine/scrim event posted to the org server in real time |
| Convex scheduler | — | 3-hour pre-scrim reminder job (runs in the cloud, cancels itself if the scrim is cancelled) |
| Stripe / analytics / turnstile | unchanged | Unrelated to scheduling; left as-is |

Every delivery is recorded in the `notifications` outbox and visible in The Den →
Overview → Notification delivery, in real time. Missing keys produce a `skipped` outbox row
naming the exact key to add in the Keys tab — nothing silently fails.

## 5. Realtime workflow (not simulated)

1. Den creates/edits a routine block → Convex mutation → scheduler fires `routineBroadcast` → Resend email + Discord webhook (recorded in outbox).
2. Den confirms a scrim → mutation patches status → scheduler fires `scrimNotify` → email to org + each roster player, SMS to players with phone, Discord post; plus a scheduled `scrimReminder` 3h before start.
3. Player taps Confirm / Maybe / Can't make → mutation upserts `routineConfirmations` → Den attendance re-renders reactively (zero refresh).
4. Den logs a scrim result → mutation sets completed + result + scores + VOD → `scrimNotify` (completed) → email/SMS/Discord, and the public `/schedule` page + The Den record update live.

## 6. UI changes

- **The Den** → new **Schedule Hub** nav item: stat cards (blocks, confirmations this week, upcoming scrims, W–L–D record), weekly routine editor (create/edit/delete per day), scrim board with Confirm/Log result/Cancel, scrim history with VOD links.
- **The Pack** → new **My Schedule** nav item: next-7-days cards with one-tap attendance + live teammate counts, plus my upcoming scrims.
- **Public site** → new **Schedule** page (confirmed upcoming scrims + recent results) and nav link.
- **Overview** → live `schedule` tile + scrim entries stream into the activity feed.

## 7. Build roadmap (as executed)

1. ✅ Schema: `routineBlocks`, `routineConfirmations`, `scrims`, `players.phone`
2. ✅ Backend: `schedules.ts` (admin hub, block CRUD, scrim CRUD, result logging, player schedule, confirmations) + `notify.ts` actions (`routineBroadcast`, `scrimNotify`, `scrimReminder`)
3. ✅ The Den → Schedule Hub (weekly template + scrim board + history)
4. ✅ The Pack → My Schedule (confirmations + scrim alerts)
5. ✅ Automation hooks (email/SMS/Discord) + public Schedule page + live analytics (record, feed, overview tile)

## 8. References (how real orgs operate)

- **r/esports community:** scrim organization is consistently "Discord messages getting buried + spreadsheets" — the Schedule Hub replaces exactly that.
- **NA Practice Scrims / Broadcast.gg / Manu Scrims NA:** weekly posted schedules + LFG + confirmation discipline is the industry pattern.
- **findscrims.com / thespike.gg / Battlefy:** the free platforms orgs use for scrim matching; our public `/schedule` page plays the same "find us" role without third-party dependency.
- **Supatimer / Sesh (free Discord bots):** availability polls + scrim slots — our in-app confirmations are the website-native equivalent with realtime data.

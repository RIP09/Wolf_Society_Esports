# Wolf Society Esports — Native Android Apps

Three dedicated Android applications, all connected to the **exact same Convex backend and database** as the website (https://wolfsocietygg.vercel.app). Whatever a player or manager does in the web portals shows instantly in the apps and vice versa — one source of truth.

| App | Folder | Android package | Who uses it |
|---|---|---|---|
| **Wolf Pack** — Players | `mobile/wolf-players/` | `gg.wolfsociety.pack` | Registered & verified players: daily attendance, match reports, dashboard, profile |
| **Wolf Den** — Management | `mobile/wolf-management/` | `gg.wolfsociety.den` | The organization: approve/suspend/remove players, attendance board + overrides, match reports, overview |
| **Wolf Coach** — AI Training | `mobile/wolf-coaching/` | `gg.wolfsociety.coach` | Players & coaches: AI coaching chat (Huginn), weekly training plan, drill library, performance analytics |

All three are **Expo (React Native) apps** — a single codebase that builds for every Android OS version (Android 6.0+ / API 23+), no per-device work needed.

## Android permissions

Each app asks for the useful & recommended permissions on first launch (Android prompts automatically):

- **Notifications** (`POST_NOTIFICATIONS`) — asked in-app on launch so players/managers get updates the moment they happen.
- **Internet / Network state** — realtime sync with the shared Convex database.
- **Vibrate / Wake lock / Boot completed / Foreground service** — instant notification delivery and alarms.
- **Camera / Photos** (`CAMERA`, `READ_MEDIA_IMAGES`, `READ/WRITE_EXTERNAL_STORAGE`) — ready for profile photos and media uploads on every Android version (6.0 → 14+).

## Install from the website

The homepage (https://wolfsocietygg.vercel.app) has an **Install app** button (hero + "Get the Wolf Society apps" section):

- **Install web app** — one-tap PWA install straight from the browser (Android / desktop, offline-ready, push alerts).
- **Wolf Pack / Wolf Den / Wolf Coach** cards — link to each app's source folder here on GitHub; build the APK with the steps below and publish it, then swap the repo link for your APK/Play Store URL in `src/components/InstallApp.tsx`.

All three apps are configured for **Android 6.0+ (API 23)** via `android.minSdkVersion` in each `app.json` — every Android OS version is supported.

---

## How the apps talk to the website

- They connect to the same Convex deployment: `https://youthful-crab-344.convex.cloud`
  (set in `src/auth.ts` of each app, also configurable with `EXPO_PUBLIC_CONVEX_URL`).
- Auth is the **same** as the website:
  - Wolf Pack / Wolf Coach → email one-time-code (the same OTP emails you already receive).
  - Wolf Den → the same generated **User ID + password** (WSE-001…) used on `/auth/den`.
- Data is real-time: attendance check-ins, approvals, badges, match reports, announcements — all reactive subscriptions to the shared database.

---

## Build the APK (Android)

### 1. Prerequisites
- Node.js 18+ and npm (or Bun).
- An Expo account: `npx expo login` (free).
- The **EAS CLI**: `npm i -g eas-cli`.

### 2. Configure the backend URL (already set for you)
Each app's `src/auth.ts` defaults to the live deployment. Only change it if you deploy Convex elsewhere.

### 3. Install & build

For each app (e.g. the players app):

```bash
cd mobile/wolf-players
npm install
npm run build:apk        # → npx eas build -p android --profile preview
```

- The first build creates the project on EAS and produces an **installable APK** (works on any Android phone, side-loadable or publishable to the Play Store later).
- For the Play Store use `npm run build:aab` (production AAB).
- EAS hosts the build; the output file (`*.apk`) downloads from the link it prints.

### 4. Local Android emulator / device (optional)

```bash
cd mobile/wolf-players
npm install
npx expo start
# press "a" to open on a connected Android device / emulator
```

---

## What each app can do today

### Wolf Pack (players)
- Sign in with the email OTP used on the website (same accounts, same verification).
- **Attendance**: check in daily for practice/matches with remarks, request leave days, see streaks + AI auto-absent history.
- **Match reports**: the full post-match form (game, opponent, result, K/D/A, damage, self-rating, highlights, improvements, coach notes) — lands in The Den live.
- **Dashboard**: win rate, K/D, badges, today's attendance, announcements.
- **Profile**: players edit their **own** data only. Approvals/suspensions/badges are management-side.

### Wolf Den (management)
- Sign in with the same generated credentials as `/auth/den`.
- **Players**: approve (instantly unlocks the player portal + app), suspend, remove permanently (deletes ALL data), assign verified role badges.
- **Attendance**: pick any date, see the full day board, override any player's record (fix AI auto-absents, approve leaves), watch 30-day rates + AI flags (3+ missed days).
- **Match reports**: every player report live.
- **Overview**: live org counters (players, teams, matches, tournaments, donations, tryouts, inquiries…).

### Wolf Coach (AI training)
- **AI Coach chat**: asks the Huginn "Ask Wolf" workflow (`askAssistant`), same AI the website uses; polls the reply table and shows the answer in-app.
- **Training**: your weekly routine from the Schedule Hub + public scrims.
- **Drills**: a coach-curated drill library (aim, utility, CS, VOD review, pre-match, mental).
- **Stats**: win rate, K/D, attendance streak, and a coach's plain-language read.

---

## Keeping apps in sync with the website

The mobile apps call the same Convex functions by name (see the runtime `convex/_generated/api.js` shim — at runtime Convex resolves by string path, so adding new queries/mutations to the website requires **zero** changes in the apps). For full editor type-safety, copy `src/convex/_generated/api.d.ts` + `api.js` from the web project into each app's `convex/_generated/` folder.

## Notes
- Push notifications / web-push: the website's subscriber system already covers email + SMS + web-push; add Expo push tokens in these apps later if you want native Android notifications.
- Payments (Stripe), donations and tryouts remain web-first; the management app already shows their live counters.
- PROGA Act 2025–2026 compliance statements live on the website's legal pages.

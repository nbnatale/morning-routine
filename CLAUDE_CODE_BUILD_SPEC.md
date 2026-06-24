# Build Spec — "Morning Routine" Quiet Calisthenics App

**Audience:** Claude Code. This is your build plan. Read the whole document before writing code, then work phase by phase. Each phase has acceptance criteria; do not move on until they pass. Commit at the end of every phase with a clear message.

**Working name:** `morning-routine` (the user may rename later — keep the slug configurable, don't hard-code product copy in logic).

---

## 1. What we're building

A bodyweight ("calisthenics") interval-workout web app, designed for quiet, equipment-free morning workouts in a small room (no jumping, bare-feet friendly). It already exists as a **single-file vanilla HTML/JS prototype**, which lives in the project folder at `projects/morning-routine/` (provided alongside this spec). That prototype is the source of truth for v1 behavior, the exercise library data, and the look & feel. Your job is to turn it into a real, deployable, multi-user web app on **Cloudflare Workers**, push it to **GitHub**, and leave it ready to deploy.

**Do not throw away the prototype's logic.** The tempo engine (breathing-orb scale math, phase cadence), the exercise library, the plan builder, the audio cue system, and the focus presets are all working and considered correct. Port them faithfully; refactor for structure, don't rewrite for novelty.

### Core concepts (already designed in the prototype — preserve them)
- **Exercise library** grouped into `warmup`, `circuit`, `cooldown`. Each exercise has: `id`, `name`, `tag`, `dur` (base seconds), a `tempo` object, `how` (step array), optional `mistake`, optional `quiet` note.
- **Tempo object**: `{ kind: "reps" | "alt" | "hold" | "flow", phases: [{ l: label, d: seconds, ease?: bool }] }`. Drives the on-screen pacer and the per-rep metronome tick.
- **Breathing-orb pacer**: a circle that scales between 0.4 and 1.0 following tempo phase progress (grow on exertion phase, shrink on the `ease` phase; smooth sine for single-phase holds). Phase word shown below it; colour shifts terracotta↔sage.
- **Plan builder**: expands selected exercises × rounds into a flat segment sequence with transitions and round rests.
- **Focus presets**: Standard, Balanced, Strength, Legs & glutes, Core, Quick — each sets exercise selection + rounds + intensity.
- **Intensity**: easy/steady/strong multiplies each work interval's duration.
- **Audio**: Web Audio beeps (3-2-1 countdown, go/rest cues, finish fanfare) + soft per-rep metronome tick.
- **Wake lock** during a running session.

### Design language ("Hotel Albatross")
Dark, moody, warm. Keep these tokens (already in the prototype CSS):
```
--bg:#141d19; --bg2:#0f1714; --surface:#1d2924; --surface2:#243330; --surface3:#2c3d38;
--ink:#ece3d4; --muted:#93a097; --faint:#6f7d75;
--brass:#c9a35e; --terra:#cd6f4c; --sage:#7fa386; --line:rgba(236,227,212,.10);
```
Display font: **Fraunces** (Google Fonts). Body: system sans. Mobile-first; this is primarily a phone app used at arm's length first thing in the morning.

---

## 2. Tech stack (decisions are final — do not substitute)

- **Runtime/host:** Cloudflare Workers with **Static Assets** (the modern Workers-first model — NOT Cloudflare Pages). One Worker serves the SPA assets and the API from a single project/`wrangler.toml`.
- **Frontend:** **Vanilla TypeScript + Vite.** No React/Vue. The prototype is vanilla; keep it lean. Modularize into ES modules. Tailwind is optional and discouraged — the existing CSS-variable system is fine; convert it to a small global stylesheet.
- **PWA:** `vite-plugin-pwa` (Workbox under the hood) for manifest + service worker + offline.
- **API framework:** **Hono** (runs natively on Workers, tiny, great routing/middleware).
- **Database:** **Cloudflare D1** (serverless SQLite). Schema via `wrangler d1 migrations` (raw SQL files). Use prepared statements. (Drizzle ORM is acceptable if you prefer typed queries, but raw D1 is fine and has fewer moving parts — pick one and be consistent.)
- **Sessions / cache / rate-limit:** **Cloudflare KV** (auth sessions as signed cookie → KV lookup; cache the public exercise library; magic-link tokens with TTL).
- **Auth:** **Passkeys (WebAuthn)** as the primary method via `@simplewebauthn/server` + `@simplewebauthn/browser`, with **email magic-link** as a fallback. Anonymous use must always work without an account (see Phase 2). Sessions = httpOnly, Secure, SameSite=Lax signed cookie referencing a KV session record.
- **Email (magic links):** **Resend** via their HTTP API (store API key as a Worker secret). Do not use MailChannels.
- **Language/tooling:** TypeScript everywhere, `wrangler` v4+, Node 20+. ESLint + Prettier. `compatibility_date` = the date you scaffold (today).

---

## 3. Repository layout

```
projects/morning-routine/      # repo root — your existing folder, where the prototype html already lives
├─ public/                      # static assets copied as-is (icons, manifest handled by PWA plugin)
├─ src/
│  ├─ client/                   # the SPA (Vite root for the frontend build)
│  │  ├─ main.ts                # bootstrap
│  │  ├─ styles.css             # global styles (ported from prototype, token-based)
│  │  ├─ data/exercises.ts      # exercise library (ported verbatim from prototype) + presets
│  │  ├─ engine/
│  │  │  ├─ plan.ts             # buildPlan() — segment expansion
│  │  │  ├─ tempo.ts            # tempoAt(), orbScale(), easing — ported math
│  │  │  └─ audio.ts            # Web Audio cue system
│  │  ├─ ui/
│  │  │  ├─ build-screen.ts     # focus presets, exercise pickers, settings, summary
│  │  │  ├─ run-screen.ts       # ring, breathing orb, pacer, controls
│  │  │  └─ done-screen.ts
│  │  ├─ state/store.ts         # app state, no framework — small pub/sub
│  │  ├─ api/client.ts          # typed fetch wrapper for /api
│  │  └─ storage/local.ts       # IndexedDB (idb) for anonymous/offline persistence
│  └─ worker/                   # the Cloudflare Worker (API + asset fallthrough)
│     ├─ index.ts               # Hono app entry; mounts routes
│     ├─ routes/
│     │  ├─ exercises.ts
│     │  ├─ workouts.ts
│     │  ├─ sessions.ts
│     │  ├─ share.ts
│     │  └─ auth.ts
│     ├─ lib/
│     │  ├─ db.ts               # D1 helpers
│     │  ├─ session.ts          # cookie + KV session helpers
│     │  └─ webauthn.ts         # passkey helpers
│     └─ types.ts               # shared Env bindings + DTOs
├─ migrations/                  # D1 SQL migrations (0001_init.sql, ...)
├─ scripts/seed-exercises.ts    # seeds the exercises table from data/exercises.ts
├─ morning-routine-timer.html   # the provided v1 prototype, already at the project root (reference only; not shipped)
├─ wrangler.toml
├─ vite.config.ts
├─ package.json
├─ tsconfig.json
├─ .gitignore
├─ .dev.vars.example            # local secrets template (never commit real .dev.vars)
└─ README.md
```

Share DTO types between client and worker (a `shared/` module or a `types.ts` imported by both) so the API contract can't drift.

---

## 4. Data model (D1)

Write as `migrations/0001_init.sql`. Use TEXT UUIDs (`crypto.randomUUID()`).

```sql
-- users (email nullable: passkey-only accounts may have no email)
CREATE TABLE users (
  id           TEXT PRIMARY KEY,
  email        TEXT UNIQUE,
  display_name TEXT,
  created_at   INTEGER NOT NULL          -- epoch ms
);

-- passkey credentials
CREATE TABLE credentials (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  credential_id TEXT NOT NULL UNIQUE,    -- base64url
  public_key    TEXT NOT NULL,           -- base64url
  counter       INTEGER NOT NULL DEFAULT 0,
  transports    TEXT,                    -- json array
  created_at    INTEGER NOT NULL
);

-- exercise library (seeded from data/exercises.ts; served publicly, cached in KV)
CREATE TABLE exercises (
  id          TEXT PRIMARY KEY,
  phase       TEXT NOT NULL,             -- warmup | circuit | cooldown
  name        TEXT NOT NULL,
  tag         TEXT NOT NULL,
  base_dur    INTEGER NOT NULL,
  tempo_json  TEXT NOT NULL,
  how_json    TEXT NOT NULL,
  mistake     TEXT,
  quiet       TEXT,
  equipment   TEXT NOT NULL DEFAULT 'none',  -- none | bar | chair | wall
  sort_order  INTEGER NOT NULL DEFAULT 0
);

-- saved workout builds
CREATE TABLE workouts (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  config_json TEXT NOT NULL,             -- WorkoutConfig (see below)
  created_at  INTEGER NOT NULL,
  updated_at  INTEGER NOT NULL
);

-- completed-session history (for streaks/stats)
CREATE TABLE workout_sessions (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workout_id    TEXT REFERENCES workouts(id) ON DELETE SET NULL,
  completed_at  INTEGER NOT NULL,
  duration_sec  INTEGER NOT NULL,
  rounds        INTEGER NOT NULL,
  focus         TEXT,
  config_snapshot_json TEXT NOT NULL
);

-- shareable workouts (no auth required to consume)
CREATE TABLE shares (
  slug        TEXT PRIMARY KEY,          -- short id, e.g. nanoid 8
  config_json TEXT NOT NULL,
  created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
  is_featured INTEGER NOT NULL DEFAULT 0,
  plays       INTEGER NOT NULL DEFAULT 0,
  created_at  INTEGER NOT NULL
);

CREATE INDEX idx_workouts_user ON workouts(user_id);
CREATE INDEX idx_sessions_user ON workout_sessions(user_id, completed_at);
CREATE INDEX idx_shares_featured ON shares(is_featured);
```

**`WorkoutConfig` (the portable build object, used everywhere):**
```ts
type WorkoutConfig = {
  presetId: string | null;
  rounds: number;
  intensity: "easy" | "steady" | "strong";
  metro: boolean;
  warmup: string[];   // exercise ids, in order
  circuit: string[];
  cooldown: string[];
  // feature-set fields, optional:
  voice?: boolean;
  haptics?: boolean;
  theme?: string;
  structure?: "circuit" | "tabata" | "emom" | "amrap" | "ladder";
};
```

---

## 5. API contract (Hono, all under `/api`)

Return JSON. Auth via session cookie; protected routes 401 if absent. Validate input (zod). Rate-limit auth + share-create via KV counters.

**Auth**
- `POST /api/auth/passkey/register/options` → WebAuthn creation options (starts a registration; needs a pending email or anon handle)
- `POST /api/auth/passkey/register/verify` → verifies attestation, creates user + credential, sets session
- `POST /api/auth/passkey/login/options` → request options
- `POST /api/auth/passkey/login/verify` → verifies assertion, sets session
- `POST /api/auth/magic/request` `{ email }` → store token in KV (15-min TTL), email link via Resend
- `GET  /api/auth/magic/callback?token=…` → consume token, upsert user, set session, redirect to app
- `POST /api/auth/logout` → clear session
- `GET  /api/auth/me` → `{ user } | { user: null }`

**Exercises**
- `GET /api/exercises` → full library (public). Cache in KV; bust on seed.

**Workouts (saved builds, auth required)**
- `GET /api/workouts` · `POST /api/workouts` `{ name, config }` · `GET/PUT/DELETE /api/workouts/:id`

**Sessions (history, auth required)**
- `POST /api/sessions` `{ workoutId?, durationSec, rounds, focus, config }`
- `GET /api/sessions?from=&to=` → list
- `GET /api/sessions/stats` → `{ streakCurrent, streakBest, totalSessions, totalMinutes, byFocus, heatmap }`

**Sharing**
- `POST /api/share` `{ config }` → `{ slug }` (anon allowed; rate-limited)
- `GET /api/share/:slug` → `{ config }` (increments `plays`)
- `GET /api/gallery` → featured shares

**Routing note:** in `wrangler.toml`, set `assets.run_worker_first = ["/api/*"]` so the Worker handles API paths and static assets serve everything else. Use `not_found_handling = "single-page-application"` so client routes (`/w/:slug`, `/history`, etc.) fall back to `index.html`.

---

## 6. Build phases

Work top to bottom. Commit after each. Keep `main` always deployable.

### Phase 0 — Scaffold & deploy skeleton
- `npm create cloudflare@latest` (or `wrangler init`) targeting a Worker with static assets + Vite + TypeScript. Add Hono.
- `wrangler.toml` with `assets` (directory = Vite `dist`), `main` = worker entry, `run_worker_first = ["/api/*"]`, `compatibility_date` = today, and **placeholder** D1/KV bindings (real IDs filled by the human via the deployment guide — read them from `wrangler.toml`/env, never hard-code).
- `GET /api/health` returns `{ ok: true }`. A trivial `index.html` renders.
- **Acceptance:** `npm run dev` serves the page locally and `/api/health` responds; `npm run build` produces `dist`.
- Initialize git, write `.gitignore` (node_modules, dist, .dev.vars, .wrangler), and push to GitHub (see §7).

### Phase 1 — Port the prototype into a modular SPA (no backend)
- Move exercise library + presets into `data/exercises.ts` (typed). Port verbatim from the prototype html in `projects/morning-routine/`.
- Port the engine: `tempo.ts` (`tempoAt`, `orbScale`, easing), `plan.ts` (`buildPlan`), `audio.ts` (Web Audio cues + metronome). Keep behavior identical.
- Rebuild the three screens (build / run / done) as modules driven by a tiny `store.ts`. Preserve: focus presets, exercise pick + expandable how-to, rounds/intensity/metronome controls, summary stats, the breathing-orb run screen, controls (play/pause/skip/back/end), wake lock, keyboard shortcuts.
- **Acceptance:** full feature parity with the prototype, built through Vite, no console errors, looks identical on a phone viewport.

### Phase 2 — PWA, offline, local-first persistence
- Add `vite-plugin-pwa`: manifest (name, icons, theme `#141d19`, display standalone), service worker precaching the app shell + library so it runs offline.
- Add IndexedDB (via `idb`) layer: persist saved builds and completed-session history locally with **no account required**. History/streaks UI (calendar heatmap, current streak, total minutes) computed from local data.
- **Acceptance:** installable to home screen; works fully offline after first load; finishing a workout logs a local session; streak math correct across day boundaries (use local midnight).

### Phase 3 — Backend: D1 + exercises API
- Write `migrations/0001_init.sql` (§4). Add `scripts/seed-exercises.ts` to populate `exercises` from `data/exercises.ts`.
- Implement `GET /api/exercises` (KV-cached). Client loads library from API when online, falls back to bundled copy offline.
- **Acceptance:** `wrangler d1 migrations apply` works locally (`--local`) and the seeded library serves from the API.

### Phase 4 — Auth + cloud sync
- Implement passkey register/login (`@simplewebauthn`) and magic-link (Resend) flows; sessions in KV via signed cookie. `GET /api/auth/me`.
- Implement workouts + sessions CRUD. On login, **merge** local IndexedDB data into the account (idempotent; don't duplicate sessions — dedupe by client-generated id).
- **Acceptance:** can register a passkey, log in on a second browser, see synced saved builds + history; logout clears session; anonymous mode still fully works.

### Phase 5 — Sharing + gallery
- `POST /api/share` → slug (use nanoid). Client route `/w/:slug` loads a shared config into the build screen (no account needed). `GET /api/gallery` lists featured.
- Add a "Share this workout" action that copies the link.
- **Acceptance:** a shared link reconstructs the exact build on a logged-out device; `plays` increments.

### Phase 6 — Feature sets (build the ones the user requests; each is independent)
Implement these as cleanly separated modules so they can be toggled. The user will tell you which to include — default to **A, B, C, D** if unspecified.

- **A. Voice cues.** Web Speech API (`speechSynthesis`) speaks the exercise name + phase ("Squats — lower — drive up") and counts transitions. Toggle in settings. Must degrade silently if unsupported. Coordinate with the metronome so they don't talk over each other.
- **B. Haptics.** `navigator.vibrate()` on phase changes and the 3-2-1 countdown; a distinct pattern for round-end. Settings toggle. (iOS Safari support is limited — feature-detect, never assume.)
- **C. History & streaks polish.** Richer stats from `/api/sessions/stats`: streak, best streak, minutes, per-focus breakdown, 12-week heatmap. Already partly in Phase 2 — wire to server when logged in.
- **D. Themes.** 3–4 palette variants (keep Hotel Albatross as default) swappable via CSS-variable sets; persist choice.
- **E. Progressive overload.** Per-exercise, nudge reps/rounds/duration up gradually based on completed-session history; surface "this week: +1 round on Strength" suggestions.
- **F. Alternate timer structures.** Generalize the plan builder to **Tabata** (20/10×8), **EMOM** (every-minute-on-the-minute), **AMRAP** (fixed clock, count rounds), and **ladder** (ascending/descending reps). This multiplies content with little new data. Add a `structure` field to `WorkoutConfig`.
- **G. Expanded content.** Add a **pull tier** (equipment: `bar`) and tag exercises by `equipment` so an "equipment I have" filter works; add mobility-only and desk-break/posture routines as presets; add breathing/wind-down sessions.
- **H. Multi-week programs.** A `programs` concept layering presets across a schedule (e.g. "30-day morning ramp"). New table + simple progression UI. (Spec a `programs` + `program_days` migration when you reach this.)
- **I. Reminders.** Web Push (VAPID) via a Worker Cron trigger for a daily nudge; opt-in only.

For every feature set: add a settings toggle, persist it in `WorkoutConfig`/local prefs, keep it accessible (ARIA, reduced-motion respected), and write a short note in the README.

---

## 7. Git / GitHub

- `git init`, sensible `.gitignore`, conventional commits per phase.
- Create the remote with the GitHub CLI if available: `gh repo create morning-routine --public --source=. --remote=origin --push`. If `gh` isn't authenticated, stop and tell the user to run `gh auth login` (or create the repo in the UI and give you the remote URL) — **do not** invent credentials.
- Push after each phase. Add a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs build + `wrangler deploy` on push to `main`, using `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` repo secrets (document this in the deployment guide; don't put tokens in the repo).

---

## 8. Quality bar

- TypeScript strict; no `any` in API DTOs. ESLint + Prettier clean.
- All network calls handle offline + error states; the app never hard-crashes if the API is down (falls back to local/anonymous).
- Accessibility: keyboard operable, ARIA on controls, `prefers-reduced-motion` disables the orb animation (already handled in prototype CSS — preserve it), good contrast.
- Performance: app shell < 100 KB JS gzipped if feasible; no blocking fonts (use `font-display: swap`).
- Security: httpOnly Secure cookies, CSRF-safe (SameSite=Lax + origin check on mutations), validate/escape all inputs, rate-limit auth + share endpoints, never log secrets.
- Secrets via `wrangler secret` / `.dev.vars` (gitignored). Provide `.dev.vars.example`.
- A real `README.md`: what it is, local dev, env/bindings, deploy, architecture diagram-in-words.

## 9. Don'ts
- Don't use Cloudflare Pages, localStorage for app data (use IndexedDB/Cache API), MailChannels, or any framework not listed.
- Don't hard-code D1/KV IDs, account IDs, or secrets — read from config/env.
- Don't reinvent the tempo/orb/plan logic — port it.
- Don't block anonymous use behind auth.
- If a step needs the user's Cloudflare/GitHub account and you can't proceed, stop and ask rather than guessing.

---

**Start with Phase 0. After scaffolding and the first GitHub push, pause and confirm the skeleton deploys before continuing.** The companion file `CLOUDFLARE_DEPLOYMENT_GUIDE.md` is the human's runbook for provisioning the Cloudflare account resources you reference (D1, KV, secrets, custom domain) — assume those binding values will be filled in there.

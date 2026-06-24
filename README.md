# Morning Routine

A quiet bodyweight workout app for mornings in small rooms — no jumping, bare-feet friendly. Mobile-first PWA. Built on Cloudflare Workers + D1 + KV.

## Architecture

```
Client (Vite + vanilla TS)  →  dist/  ←  served by CF Workers Static Assets
                                            ↓
                                     Worker (Hono)
                                            ↓
                                    D1 (SQLite) + KV
```

- **Frontend:** Vanilla TypeScript, Vite, no framework
- **Backend:** Hono on Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Sessions / cache / tokens:** Cloudflare KV
- **Auth:** Passkeys (WebAuthn) + email magic-link (Resend)
- **PWA:** vite-plugin-pwa (Workbox)

## Local dev

```bash
cp .dev.vars.example .dev.vars   # fill in secrets
npm install
npm run dev                       # vite on :5173, worker API on :8787
```

Open [http://localhost:5173](http://localhost:5173). API calls at `/api/*` proxy to the worker.

## Build

```bash
npm run build       # Vite output → dist/
```

## Deploy

See **CLOUDFLARE_DEPLOYMENT_GUIDE.md** for the full provisioning runbook (create D1, KV, set secrets, deploy).

Short version after provisioning:
```bash
npm run build
npx wrangler deploy
```

GitHub Actions deploys automatically on push to `main` — add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as repo secrets first.

## Environment / bindings

| Name | Type | Purpose |
|---|---|---|
| `DB` | D1 | Primary database |
| `SESSIONS` | KV | Auth sessions, magic-link tokens, exercise cache |
| `SESSION_SECRET` | Secret | HMAC key for signed session cookies |
| `RESEND_API_KEY` | Secret | Magic-link emails via Resend |
| `RP_ID` | Secret | WebAuthn relying-party ID (e.g. `morningroutine.app`) |
| `RP_ORIGIN` | Secret | Full origin (e.g. `https://morningroutine.app`) |

See `.dev.vars.example` for local values.

## Phases

- **Phase 0** ✅ Scaffold, skeleton Worker + Vite, GitHub, CI
- **Phase 1** Port prototype → modular SPA (full feature parity)
- **Phase 2** PWA, offline, local-first IndexedDB persistence
- **Phase 3** D1 schema, migrations, exercises API
- **Phase 4** Auth (passkeys + magic-link), cloud sync
- **Phase 5** Sharing + gallery
- **Phase 6** Feature sets (voice, haptics, history, themes, …)

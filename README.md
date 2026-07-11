# Morning Routine

A personal bodyweight workout timer — low-impact floor work built for small rooms. Mobile-first PWA.

Built entirely with [Claude Code](https://claude.ai/code).

## What it does

- Three prebuilt day presets (Day A / B / C) that rotate automatically based on your last session
- Guided exercise form with tempo cues and a breathing orb on the run screen
- Local-first: all session history and streaks live in IndexedDB — no account needed
- Installable as a PWA (works offline after first load)

## Stack

- **Frontend:** Vanilla TypeScript, Vite, no framework
- **Backend:** Hono on Cloudflare Workers
- **Database:** Cloudflare D1 (exercise library)
- **Cache:** Cloudflare KV (exercise library cache)
- **PWA:** vite-plugin-pwa (Workbox)

## Local dev

```bash
npm install
npm run dev     # Vite on :5173
```

Open [http://localhost:5173](http://localhost:5173). The worker API proxies through Vite in dev mode.

## Deploy

```bash
npm run build
wrangler deploy
```

See **CLOUDFLARE_DEPLOYMENT_GUIDE.md** for provisioning D1 and KV from scratch.

## Bindings

| Name | Type | Purpose |
|---|---|---|
| `DB` | D1 | Exercise library |
| `SESSIONS` | KV | Exercise library cache |
| `ASSETS` | Static Assets | SPA and PWA files |

## Status

- **Phase 0** ✅ Scaffold — Cloudflare Workers + Vite + Hono skeleton
- **Phase 1** ✅ Full SPA — modular TypeScript, all screens, timer engine
- **Phase 2** ✅ PWA — offline support, IndexedDB session history, streaks
- **Phase 3** ✅ D1 exercises API — server-side library with KV cache, client fallback
- **Phase 4** ✅ Day rotation — A/B/C presets with auto-suggest based on last session

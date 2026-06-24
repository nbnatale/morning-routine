# Cloudflare Deployment Guide — Morning Routine

This is **your** runbook (not Claude Code's). It provisions the Cloudflare resources the app needs and wires them up. Claude Code builds the code and references these bindings by name; here you create the actual resources and paste their IDs into `wrangler.toml`, then deploy.

Do these in order. Most steps are one-time.

---

## 0. Prerequisites
- A Cloudflare account (free tier is fine to start).
- Node 20+ and the repo cloned locally (Claude Code will have pushed it to GitHub).
- Install Wrangler and log in:
  ```bash
  npm install -g wrangler        # or use the repo's local wrangler via npx
  wrangler login                 # opens a browser to authorize
  wrangler whoami                # confirm account + grab your Account ID
  ```

---

## 1. Create the D1 database
```bash
wrangler d1 create morning-routine-db
```
This prints a `database_id`. Copy it into `wrangler.toml`:
```toml
[[d1_databases]]
binding = "DB"
database_name = "morning-routine-db"
database_id = "PASTE_THE_ID_HERE"
```

Apply migrations and seed the exercise library:
```bash
# local dev database first
wrangler d1 migrations apply morning-routine-db --local
npm run seed:local          # script Claude Code added (scripts/seed-exercises.ts)

# then production
wrangler d1 migrations apply morning-routine-db --remote
npm run seed:remote
```

---

## 2. Create the KV namespace (sessions + cache + tokens)
```bash
wrangler kv namespace create SESSIONS
```
It prints an `id`. Add to `wrangler.toml`:
```toml
[[kv_namespaces]]
binding = "SESSIONS"
id = "PASTE_THE_ID_HERE"
```
(If you want a separate cache namespace, repeat for `CACHE` — optional; one namespace is fine to start.)

---

## 3. Set secrets
These are runtime secrets, never committed. Set them for production with `wrangler secret put`, and put local copies in a gitignored `.dev.vars` file (copy `.dev.vars.example`).

```bash
wrangler secret put SESSION_SECRET     # a long random string; e.g. `openssl rand -base64 32`
wrangler secret put RESEND_API_KEY     # from resend.com (for magic-link emails)
wrangler secret put RP_ID              # your domain, e.g. morningroutine.app (passkey relying-party id)
wrangler secret put RP_ORIGIN          # https://morningroutine.app
```
`.dev.vars` (local only):
```
SESSION_SECRET=...dev value...
RESEND_API_KEY=...
RP_ID=localhost
RP_ORIGIN=http://localhost:8787
```

> Passkeys are bound to `RP_ID`/origin. Use `localhost` locally and your real domain in production — a credential registered on one won't work on the other, which is expected.

---

## 4. First deploy
```bash
npm run build          # Vite builds the SPA into dist/
wrangler deploy        # uploads the Worker + static assets
```
Wrangler prints a `*.workers.dev` URL. Open it — the app should load, install as a PWA, and `/api/health` should return `{ ok: true }`. Register a passkey to smoke-test auth (use the workers.dev origin, and make sure `RP_ID`/`RP_ORIGIN` match it for this test, or just test passkeys after you attach the custom domain in step 5).

---

## 5. Custom domain (optional but recommended for passkeys)
1. Add your domain to Cloudflare (or buy one via **Workers & Pages → your worker → Settings → Domains & Routes → Add custom domain**).
2. Attach it to the Worker there. DNS is handled automatically if the zone is on Cloudflare.
3. Update the `RP_ID` and `RP_ORIGIN` secrets to the real domain and re-run `wrangler secret put` for each, then `wrangler deploy`.

---

## 6. Continuous deployment from GitHub
Two options — pick one.

**A. GitHub Actions (the workflow Claude Code added):** In your GitHub repo → Settings → Secrets and variables → Actions, add:
- `CLOUDFLARE_API_TOKEN` — create at Cloudflare dashboard → My Profile → API Tokens → "Edit Cloudflare Workers" template.
- `CLOUDFLARE_ACCOUNT_ID` — from `wrangler whoami`.

Now every push to `main` builds and deploys.

**B. Cloudflare Workers Builds (dashboard-native):** In Workers & Pages → your worker → Settings → Builds, connect the GitHub repo and set the build command (`npm run build`) and deploy command (`wrangler deploy`). Cloudflare builds on push without you managing tokens.

---

## 7. Day-2 operations
- **Inspect data:** `wrangler d1 execute morning-routine-db --remote --command "SELECT count(*) FROM users;"`
- **Tail logs:** `wrangler tail`
- **New migration:** `wrangler d1 migrations create morning-routine-db add_programs` then edit the SQL and `apply` (local then remote).
- **Rotate a secret:** re-run `wrangler secret put NAME`.
- **Feature the best community workouts:** flip `is_featured = 1` on a row in `shares` so it appears in the public gallery.

---

## 8. Cost expectations
On the free tier you get a generous Workers request allowance, D1 (storage + rows-read/written quotas), and KV reads/writes — comfortably enough for personal use and early sharing. Static-asset requests don't count against Worker invocations. If it takes off, the Workers Paid plan ($5/mo) raises the limits well before you'd realistically hit them for an app like this. Check current limits in the Cloudflare dashboard, since quotas change.

---

That's the whole loop: Claude Code builds and pushes, you provision D1 + KV + secrets and `wrangler deploy`, then GitHub auto-deploys thereafter. Start the app on `main`, confirm the Phase 0 skeleton deploys, and let Claude Code proceed through the phases.

export interface Env {
  // optional until real IDs are provisioned and uncommented in wrangler.toml
  // (see CLOUDFLARE_DEPLOYMENT_GUIDE.md) — routes must check before using them
  DB?: D1Database
  SESSIONS?: KVNamespace
  // Phase 4+: uncomment when auth is implemented
  // SESSION_SECRET: string
  // RESEND_API_KEY: string
  // RP_ID: string
  // RP_ORIGIN: string
}

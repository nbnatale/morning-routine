export interface Env {
  ASSETS: Fetcher
  DB?: D1Database
  SESSIONS?: KVNamespace
  // Phase 4+: uncomment when auth is implemented
  // SESSION_SECRET: string
  // RESEND_API_KEY: string
  // RP_ID: string
  // RP_ORIGIN: string
}

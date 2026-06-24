export interface Env {
  DB: D1Database
  SESSIONS: KVNamespace
  SESSION_SECRET: string
  RESEND_API_KEY: string
  RP_ID: string
  RP_ORIGIN: string
}

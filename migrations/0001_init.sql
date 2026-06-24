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
  config_json TEXT NOT NULL,             -- WorkoutConfig (see shared/types.ts)
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

-- ============================================================
-- 004_auth_system.sql — Authentication, sessions, invites
-- ============================================================

-- ── PASSWORD HASH on users table ───────────────────────────
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

-- ── SESSIONS (JWT tracking — optional, for revocation) ─────
CREATE TABLE IF NOT EXISTS sessions (
  id          TEXT PRIMARY KEY,             -- JWT jti claim
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ NOT NULL,
  revoked     BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- ── INVITE TOKENS (Public Join) ────────────────────────────
CREATE TABLE IF NOT EXISTS invite_tokens (
  token       TEXT PRIMARY KEY,             -- short random string
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  created_by  TEXT REFERENCES users(id),
  max_uses    INTEGER DEFAULT 5,
  uses        INTEGER DEFAULT 0,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invite_campaign ON invite_tokens(campaign_id);

-- ── GUEST PLAYERS (tracks guests who joined via invite) ────
CREATE TABLE IF NOT EXISTS guest_players (
  id          TEXT PRIMARY KEY,             -- random guest ID
  campaign_id TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  slot        INTEGER NOT NULL DEFAULT 0,
  character   JSONB DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ── UPDATE WORLD LIBRARY for owner tracking ────────────────
-- owner_id already added in migration 003, but ensure it exists
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS owner_id TEXT REFERENCES users(id);

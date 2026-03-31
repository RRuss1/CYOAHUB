-- ============================================================
-- 007_user_uploads.sql — Track per-user R2 image uploads
-- Enforces upload limits: admin unlimited, others max 20.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_uploads (
  id          BIGSERIAL PRIMARY KEY,
  user_id     TEXT NOT NULL,
  r2_key      TEXT NOT NULL UNIQUE,
  size_bytes  INTEGER DEFAULT 0,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_uploads_user ON user_uploads(user_id);

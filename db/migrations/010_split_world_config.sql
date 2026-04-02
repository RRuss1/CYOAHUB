-- ============================================================
-- 010_split_world_config.sql — Promote key config fields to columns
-- Improves query performance and clarity for world_library
-- ============================================================

-- ── New columns on world_library ──
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS era           TEXT DEFAULT 'Medieval';
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS tone          TEXT DEFAULT 'Epic Heroic';
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS combat_freq   TEXT DEFAULT 'Moderate';
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS card_image    TEXT DEFAULT '';
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS theme_primary TEXT DEFAULT '#C9A84C';
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS narrator_style TEXT DEFAULT 'Epic & Mythic';
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS lethality     TEXT DEFAULT 'Balanced — Death is possible';
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS climate       TEXT DEFAULT 'Temperate — Mild seasons';
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS difficulty    TEXT DEFAULT 'Balanced — Fair challenge';
ALTER TABLE world_library ADD COLUMN IF NOT EXISTS owner_id      TEXT DEFAULT NULL;

-- ── Backfill from existing JSONB config ──
UPDATE world_library SET
  era            = COALESCE(config->>'era', 'Medieval'),
  tone           = COALESCE(config->>'tone', config->'gm'->>'tone', 'Epic Heroic'),
  combat_freq    = COALESCE(config->>'combatFrequency', 'Moderate'),
  card_image     = COALESCE(config->>'cardImage', ''),
  theme_primary  = COALESCE(config->'theme'->>'primary', '#C9A84C'),
  narrator_style = COALESCE(config->>'narratorStyle', config->'gm'->>'narratorStyle', 'Epic & Mythic'),
  lethality      = COALESCE(config->>'lethality', config->'gm'->>'lethality', 'Balanced — Death is possible'),
  climate        = COALESCE(config->>'climate', 'Temperate — Mild seasons'),
  difficulty     = COALESCE(config->'rules'->>'difficulty', config->>'difficulty', 'Balanced — Fair challenge')
WHERE system = 'custom';

-- ── Backfill owner_id from campaigns table (first campaign creator owns the world) ──
UPDATE world_library w SET owner_id = c.owner_id
FROM campaigns c
WHERE c.world_id = w.world_id
  AND w.owner_id IS NULL
  AND c.owner_id IS NOT NULL;

-- ── Mark worlds with an owner as published (they were created intentionally) ──
UPDATE world_library SET published = true
WHERE system = 'custom' AND owner_id IS NOT NULL AND published = false;

-- ── Indexes for common queries ──
CREATE INDEX IF NOT EXISTS idx_world_library_era ON world_library(era);
CREATE INDEX IF NOT EXISTS idx_world_library_combat_freq ON world_library(combat_freq);
CREATE INDEX IF NOT EXISTS idx_world_library_tone ON world_library(tone);
CREATE INDEX IF NOT EXISTS idx_world_library_owner ON world_library(owner_id);

-- Note: The config JSONB column is kept as-is for now.
-- It still holds the full world config needed by CustomSystem.build().
-- The new columns are for display, filtering, and quick lookups
-- without parsing the JSONB blob.

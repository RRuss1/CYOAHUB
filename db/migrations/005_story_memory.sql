-- ============================================================
-- 005_story_memory.sql — Story Arc Memory, NPC Registry, Story Beats
-- ============================================================

-- ── STORY ARC MEMORY (persistent structured narrative state) ──
CREATE TABLE IF NOT EXISTS story_arcs (
  campaign_id   TEXT PRIMARY KEY REFERENCES campaigns(id) ON DELETE CASCADE,
  act           INTEGER DEFAULT 1,
  npcs          JSONB DEFAULT '[]',       -- [{name, disposition, lastSeen, notes}]
  factions      JSONB DEFAULT '{}',       -- {factionName: "friendly"|"hostile"|"neutral"|"unknown"}
  secrets       JSONB DEFAULT '[]',       -- ["the merchant is actually a spy", ...]
  threads       JSONB DEFAULT '[]',       -- [{desc, introduced_turn, resolved: false}]
  consequences  JSONB DEFAULT '[]',       -- [{turn, desc, still_active: true}]
  locations_visited JSONB DEFAULT '[]',   -- [{name, turn, event_summary}]
  reputation    JSONB DEFAULT '{}',       -- {factionOrNpc: number -10 to 10}
  dramatic_question TEXT DEFAULT '',       -- "Will the party choose power or freedom?"
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── STORY BEAT TEMPLATES (configurable pacing nudges) ──
-- These live in the world config (SystemData.storyBeats), not a separate table.
-- But we store per-campaign beat progress here:
CREATE TABLE IF NOT EXISTS story_beat_progress (
  campaign_id   TEXT NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  beat_index    INTEGER NOT NULL,
  triggered     BOOLEAN DEFAULT false,
  triggered_at  INTEGER,                  -- turn number when triggered
  PRIMARY KEY (campaign_id, beat_index)
);

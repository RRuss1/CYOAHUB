-- 008_backfill_era_weapon_pools.sql
-- Ensure all custom worlds have an 'era' key in their config.
-- The runtime custom.js build() uses cfg.era to select era-appropriate
-- weapon pools, starting kits, and armors. Worlds without era default
-- to 'Medieval' at runtime, but this makes it explicit in the DB.

UPDATE world_library
SET config = config || '{"era": "Medieval"}'::jsonb
WHERE system = 'custom'
  AND NOT config ? 'era';

-- Also strip any stale heroWeapons/weapons/startingKits/armors from
-- custom world configs so they pick up the new era-based pools at runtime.
-- Only do this for worlds that were using the old hardcoded medieval fallback
-- (i.e. they have no explicit heroWeapons in their config).
-- Worlds with user-defined weapons are left untouched.
UPDATE world_library
SET config = config - 'heroWeapons' - 'weapons' - 'startingKits' - 'armors'
WHERE system = 'custom'
  AND config ? 'heroWeapons'
  AND config->>'heroWeapons' LIKE '%"id":"sword"%'
  AND config->>'heroWeapons' LIKE '%"id":"axe"%'
  AND config->>'heroWeapons' LIKE '%"id":"hammer"%';

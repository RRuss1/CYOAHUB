-- 009_indexes_and_fk_fixes.sql
-- Add missing indexes for commonly filtered columns and fix FK constraints.

-- campaigns.owner_id — filtered on every campaign list query
CREATE INDEX IF NOT EXISTS idx_campaigns_owner ON campaigns(owner_id);

-- world_library.owner_id — filtered when loading "my worlds"
CREATE INDEX IF NOT EXISTS idx_world_library_owner ON world_library(owner_id);

-- world_library.published — filtered on community world listing
CREATE INDEX IF NOT EXISTS idx_world_library_published ON world_library(published);

-- user_uploads.user_id — missing FK constraint, orphans on user delete
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_user_uploads_user'
  ) THEN
    ALTER TABLE user_uploads
      ADD CONSTRAINT fk_user_uploads_user
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- campaigns owned by deleted users — set owner_id to NULL instead of orphaning
-- (allows admin to reclaim or auto-delete later)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'fk_campaigns_owner'
  ) THEN
    ALTER TABLE campaigns
      ADD CONSTRAINT fk_campaigns_owner
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Record migration
INSERT INTO _migrations (name) VALUES ('009_indexes_and_fk_fixes')
ON CONFLICT DO NOTHING;

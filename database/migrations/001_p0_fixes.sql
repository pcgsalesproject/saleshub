-- P0 fixes migration — safe to run against an existing production database.
-- Unlike database/schema.sql (a full DROP/CREATE bootstrap for fresh installs),
-- this file is additive/idempotent and does not drop or truncate any table.

-- 1) Close out any legacy stacked active assignments (more than one active
--    assignment on the same asset), keeping only the most recently assigned
--    one open, so the unique index below can be created without failing.
WITH ranked AS (
  SELECT id, asset_id,
         ROW_NUMBER() OVER (PARTITION BY asset_id ORDER BY assigned_at DESC, id DESC) AS rn
  FROM asset_assignments
  WHERE returned_at IS NULL
)
UPDATE asset_assignments aa
SET returned_at = NOW()
FROM ranked
WHERE aa.id = ranked.id AND ranked.rn > 1;

-- 2) Only one active (not yet returned) assignment per asset at a time
CREATE UNIQUE INDEX IF NOT EXISTS asset_assignments_active_asset_idx
  ON asset_assignments (asset_id) WHERE returned_at IS NULL;

-- 3) Role-based access control
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL CHECK (name IN ('admin', 'viewer'))
);

CREATE TABLE IF NOT EXISTS user_roles (
    id SERIAL PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    role_id INT NOT NULL REFERENCES roles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO roles (name) VALUES ('admin'), ('viewer') ON CONFLICT DO NOTHING;

-- 4) Snapshot of who was holding an asset at the moment it was checked, so
--    inspection reports never re-attribute a historical check after a
--    later transfer of the asset.
ALTER TABLE asset_checks ADD COLUMN IF NOT EXISTS holder_employee_id INT REFERENCES employees(id);

-- 5) Bootstrap: assign the first admin manually, e.g.
-- INSERT INTO user_roles (email, role_id) VALUES ('you@example.com', (SELECT id FROM roles WHERE name = 'admin'));
-- Any authenticated user without a row in user_roles is treated as 'viewer' (read-only).

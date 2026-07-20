-- Adds the org chart builder (drag-and-drop employee assignment) for Sales Admin.

CREATE TABLE IF NOT EXISTS org_chart_nodes (
    id SERIAL PRIMARY KEY,
    chart_key TEXT NOT NULL DEFAULT 'sales-admin',
    parent_id INT REFERENCES org_chart_nodes(id) ON DELETE CASCADE,
    position INT NOT NULL DEFAULT 0,
    tag TEXT,
    is_exec BOOLEAN NOT NULL DEFAULT false,
    employee_id INT REFERENCES employees(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS org_chart_nodes_parent_idx ON org_chart_nodes (parent_id);

-- Seed the fixed Sales Admin structure once: root (Head of Sales Admin) + 4 team-lead slots
DO $$
DECLARE
  root_id INT;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM org_chart_nodes WHERE chart_key = 'sales-admin' AND parent_id IS NULL) THEN
    INSERT INTO org_chart_nodes (chart_key, parent_id, position, tag, is_exec)
    VALUES ('sales-admin', NULL, 0, NULL, true)
    RETURNING id INTO root_id;

    INSERT INTO org_chart_nodes (chart_key, parent_id, position, tag, is_exec) VALUES
      ('sales-admin', root_id, 0, 'Admin TT', false),
      ('sales-admin', root_id, 1, 'Admin MT', false),
      ('sales-admin', root_id, 2, 'Admin CLM', false),
      ('sales-admin', root_id, 3, 'System Admin', false);
  END IF;
END $$;

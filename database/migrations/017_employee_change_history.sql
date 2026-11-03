-- Employee change history (department / sales area / position), shown as a timeline on the employee page.
-- Append-only: rows are never edited or deleted; the only allowed update is a pending row becoming applied.

CREATE TABLE IF NOT EXISTS employee_change_history (
  id             BIGSERIAL PRIMARY KEY,
  employee_id    INTEGER      NOT NULL REFERENCES employees(id),
  change_type    VARCHAR(30)  NOT NULL
                 CHECK (change_type IN ('department_transfer', 'sales_area_transfer', 'position_adjustment')),
  -- Before / After snapshot: always {"id": <master id or null>, "name": "<display name or null>"}
  old_value      JSONB        NOT NULL CHECK (jsonb_typeof(old_value) = 'object' AND old_value ? 'id' AND old_value ? 'name'),
  new_value      JSONB        NOT NULL CHECK (jsonb_typeof(new_value) = 'object' AND new_value ? 'id' AND new_value ? 'name'),
  effective_date DATE         NOT NULL,
  reason         TEXT,
  status         VARCHAR(10)  NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'pending')),
  applied_at     TIMESTAMPTZ,
  recorded_by    VARCHAR(255),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ech_employee_effective ON employee_change_history (employee_id, effective_date DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_ech_employee_type      ON employee_change_history (employee_id, change_type);
CREATE INDEX IF NOT EXISTS idx_ech_pending            ON employee_change_history (effective_date) WHERE status = 'pending';

-- Audit trail: no deletes, and the only update allowed is pending -> applied (status / applied_at).
CREATE OR REPLACE FUNCTION employee_change_history_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'employee_change_history is append-only';
  END IF;
  IF OLD.status = 'pending' AND NEW.status = 'applied'
     AND (to_jsonb(NEW) - 'status' - 'applied_at') = (to_jsonb(OLD) - 'status' - 'applied_at') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'employee_change_history rows cannot be modified';
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employee_change_history_guard ON employee_change_history;
CREATE TRIGGER trg_employee_change_history_guard
  BEFORE UPDATE OR DELETE ON employee_change_history
  FOR EACH ROW EXECUTE FUNCTION employee_change_history_guard();

-- RLS: signed-in users may read; there are no insert/update/delete policies, so writes
-- only happen through the app's server actions (which check the admin role).
ALTER TABLE employee_change_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS employee_change_history_read ON employee_change_history;
CREATE POLICY employee_change_history_read ON employee_change_history
  FOR SELECT TO authenticated USING (true);

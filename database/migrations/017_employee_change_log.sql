-- Field-level change history for employees (shown on the employee page, tab "ประวัติการเปลี่ยนแปลง")
CREATE TABLE IF NOT EXISTS employee_change_log (
  id           BIGSERIAL PRIMARY KEY,
  employee_id  INTEGER      NOT NULL,
  field_label  VARCHAR(100) NOT NULL,
  old_value    TEXT,
  new_value    TEXT,
  changed_by   VARCHAR(255),
  changed_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_change_log_employee
  ON employee_change_log (employee_id, changed_at DESC);

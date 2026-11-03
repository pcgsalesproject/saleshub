-- Allow deleting an employee: their change history is deleted along with them.
-- History rows stay append-only otherwise; DELETE is only permitted once the employee row is gone
-- (i.e. when it comes from the ON DELETE CASCADE).

ALTER TABLE employee_change_history
  DROP CONSTRAINT IF EXISTS employee_change_history_employee_id_fkey,
  ADD CONSTRAINT employee_change_history_employee_id_fkey
    FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE;

CREATE OR REPLACE FUNCTION employee_change_history_guard() RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF EXISTS (SELECT 1 FROM employees WHERE id = OLD.employee_id) THEN
      RAISE EXCEPTION 'employee_change_history is append-only';
    END IF;
    RETURN OLD;
  END IF;
  IF OLD.status = 'pending' AND NEW.status = 'applied'
     AND (to_jsonb(NEW) - 'status' - 'applied_at') = (to_jsonb(OLD) - 'status' - 'applied_at') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION 'employee_change_history rows cannot be modified';
END;
$$ LANGUAGE plpgsql;

-- Replaces the placeholder Sales Admin org chart with the real reporting structure:
-- a company-level root above it, full reporting chains under each team, a merged
-- (no-connector-line) pair for the two System Admin managers, and vacant seats.

ALTER TABLE org_chart_nodes ADD COLUMN IF NOT EXISTS note TEXT;
ALTER TABLE org_chart_nodes ADD COLUMN IF NOT EXISTS pair_group TEXT;

DO $$
DECLARE
  old_root_id INT;
  new_root_id INT;
  clm_id INT;
  tt_id INT;
  sysadmin_id INT;
  mt_id INT;
  cur_id INT;
BEGIN
  SELECT id INTO old_root_id FROM org_chart_nodes WHERE chart_key = 'sales-admin' AND parent_id IS NULL;

  -- Insert the company-level root (รองกรรมการผู้จัดการสายงานขาย) above the existing
  -- Sales Admin head, once.
  IF NOT EXISTS (SELECT 1 FROM org_chart_nodes WHERE chart_key = 'sales-admin' AND employee_id = 1 AND parent_id IS NULL) THEN
    INSERT INTO org_chart_nodes (chart_key, parent_id, position, tag, is_exec, employee_id)
    VALUES ('sales-admin', NULL, 0, NULL, true, 1)
    RETURNING id INTO new_root_id;

    UPDATE org_chart_nodes SET parent_id = new_root_id WHERE id = old_root_id;
  END IF;

  -- Re-order the 4 branches to match the real chart: CLM, TT, System Admin, MT
  UPDATE org_chart_nodes SET position = 0 WHERE chart_key = 'sales-admin' AND tag = 'Admin CLM';
  UPDATE org_chart_nodes SET position = 1 WHERE chart_key = 'sales-admin' AND tag = 'Admin TT';
  UPDATE org_chart_nodes SET position = 2 WHERE chart_key = 'sales-admin' AND tag = 'System Admin';
  UPDATE org_chart_nodes SET position = 3 WHERE chart_key = 'sales-admin' AND tag = 'Admin MT';

  SELECT id INTO clm_id      FROM org_chart_nodes WHERE chart_key = 'sales-admin' AND tag = 'Admin CLM';
  SELECT id INTO tt_id       FROM org_chart_nodes WHERE chart_key = 'sales-admin' AND tag = 'Admin TT';
  SELECT id INTO sysadmin_id FROM org_chart_nodes WHERE chart_key = 'sales-admin' AND tag = 'System Admin';
  SELECT id INTO mt_id       FROM org_chart_nodes WHERE chart_key = 'sales-admin' AND tag = 'Admin MT';

  -- Admin CLM chain: lead -> ปภัสรา (พม่า) -> ณัฐชา (กัมพูชา, สปป.ลาว)
  IF NOT EXISTS (SELECT 1 FROM org_chart_nodes WHERE parent_id = clm_id) THEN
    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id, note)
    VALUES ('sales-admin', clm_id, 0, 159, 'พม่า')
    RETURNING id INTO cur_id;

    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id, note)
    VALUES ('sales-admin', cur_id, 0, 160, 'กัมพูชา, สปป.ลาว');
  END IF;

  -- Admin TT chain: lead (กทม.) -> ธัญญา (อีสาน, ตะวันออก, กลาง) -> นุชนาฏ (เหนือ, ใต้) -> ว่าง
  UPDATE org_chart_nodes SET note = 'กทม.' WHERE id = tt_id;
  IF NOT EXISTS (SELECT 1 FROM org_chart_nodes WHERE parent_id = tt_id) THEN
    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id, note)
    VALUES ('sales-admin', tt_id, 0, 157, 'อีสาน, ตะวันออก, กลาง')
    RETURNING id INTO cur_id;

    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id, note)
    VALUES ('sales-admin', cur_id, 0, 158, 'เหนือ, ใต้')
    RETURNING id INTO cur_id;

    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id, note)
    VALUES ('sales-admin', cur_id, 0, NULL, 'พนักงานธุรการขาย');
  END IF;

  -- System Admin: two managers merged into one card with no connector line
  -- between them, then a vacant seat below the pair.
  UPDATE org_chart_nodes SET employee_id = 161, pair_group = 'sysadmin' WHERE id = sysadmin_id;
  IF NOT EXISTS (SELECT 1 FROM org_chart_nodes WHERE pair_group = 'sysadmin' AND id != sysadmin_id) THEN
    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id, pair_group)
    SELECT 'sales-admin', parent_id, position, 162, 'sysadmin' FROM org_chart_nodes WHERE id = sysadmin_id;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM org_chart_nodes WHERE parent_id = sysadmin_id) THEN
    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id, note)
    VALUES ('sales-admin', sysadmin_id, 0, NULL, 'พนักงานธุรการขาย');
  END IF;

  -- Admin MT chain: lead -> ชาลินี -> ชนกภัทร์ -> นิภาพร -> สิริลักษณ์
  IF NOT EXISTS (SELECT 1 FROM org_chart_nodes WHERE parent_id = mt_id) THEN
    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id)
    VALUES ('sales-admin', mt_id, 0, 164)
    RETURNING id INTO cur_id;

    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id)
    VALUES ('sales-admin', cur_id, 0, 165)
    RETURNING id INTO cur_id;

    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id)
    VALUES ('sales-admin', cur_id, 0, 166)
    RETURNING id INTO cur_id;

    INSERT INTO org_chart_nodes (chart_key, parent_id, position, employee_id)
    VALUES ('sales-admin', cur_id, 0, 167);
  END IF;
END $$;

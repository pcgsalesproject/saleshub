-- Adds employee nicknames (used in org chart / team roster avatars and name
-- display) and per-node job-scope bullets shown on the team roster cards.

ALTER TABLE employees ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE org_chart_nodes ADD COLUMN IF NOT EXISTS responsibilities TEXT[];

UPDATE employees SET nickname = 'ฝ้าย'   WHERE id = 159 AND nickname IS NULL;
UPDATE employees SET nickname = 'กล้วย'  WHERE id = 160 AND nickname IS NULL;
UPDATE employees SET nickname = 'แจ๋ม'   WHERE id = 156 AND nickname IS NULL;
UPDATE employees SET nickname = 'ตุ๊กตา' WHERE id = 157 AND nickname IS NULL;
UPDATE employees SET nickname = 'นุช'    WHERE id = 158 AND nickname IS NULL;
UPDATE employees SET nickname = 'ตุ่'    WHERE id = 161 AND nickname IS NULL;
UPDATE employees SET nickname = 'กิ๊ง'   WHERE id = 162 AND nickname IS NULL;

UPDATE org_chart_nodes SET responsibilities = ARRAY[
  'ดูแลและสนับสนุนระบบงานขาย',
  'ติดตามและบริหารโครงการระบบงานขาย',
  'หาแนวทางเพื่อพัฒนาต่อยอดระบบงานขาย',
  'ควบคุมและตรวจสอบความถูกต้องของข้อมูลระบบงานขาย',
  'ประสานงานด้านระบบและโปรเจคต่างๆกับทาง IT'
] WHERE employee_id = 161 AND responsibilities IS NULL;

UPDATE org_chart_nodes SET responsibilities = ARRAY[
  'บริหารสิทธิ์การเข้าใช้งานระบบของพนักงานฝ่ายขาย',
  'ดูแลข้อมูล Master Data และข้อมูลลูกค้าในระบบ ERP',
  'ประสานงานจัดซื้ออุปกรณ์ IT กับผู้ให้บริการภายนอก',
  'จัดทำและควบคุมงบประมาณอุปกรณ์ IT ประจำปี',
  'ตรวจสอบและบริหารจัดการอุปกรณ์ IT ของทีมฝ่ายขาย'
] WHERE employee_id = 162 AND responsibilities IS NULL;

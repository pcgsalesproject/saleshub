-- Job scope bullets for สิริลักษณ์ จงสุจริตธรรม (Admin MT branch).

UPDATE org_chart_nodes SET responsibilities = ARRAY[
  'สนับสนุนการดำเนินงานของ Key Account (KA) และฝ่ายขาย',
  'ดูแลการเปิดคำสั่งซื้อและการยืนยันใบสั่งซื้อ (Confirm Invoice)',
  'ประสานงานระหว่างฝ่ายขาย บัญชี และ Trade Marketing',
  'บริหารเอกสารค่าใช้จ่ายและเอกสารประกอบการเบิกจ่าย',
  'ดูแลข้อมูลลูกค้าและ Master Data (CV Code / MDMs)',
  'ติดตามและประสานงานด้านภาษีหัก ณ ที่จ่าย',
  'จัดทำและติดตาม Log Book ค่าใช้จ่ายเพื่อรายงาน KA'
] WHERE employee_id = 167;

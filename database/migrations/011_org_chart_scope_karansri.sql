-- Job scope bullets for กรัณฑ์ศรี ชัยภูมิพินิจ (Admin MT branch lead).

UPDATE org_chart_nodes SET responsibilities = ARRAY[
  'บริหารภาพรวมงาน Sales Administration และสนับสนุนการดำเนินงานของฝ่ายขาย',
  'บริหารและติดตามกระบวนการคำสั่งซื้อ (Order Management) และการจัดส่งสินค้า',
  'วิเคราะห์และสรุปข้อมูลยอดขายเพื่อสนับสนุนผู้บริหารและ Key Account (KA)',
  'บริหารและจัดทำค่าคอมมิชชั่นของฝ่ายขาย MT และพนักงานใหม่',
  'พัฒนาและปรับปรุงระบบงาน เช่น Confirm Invoice Auto และ Master Data (MDMs)',
  'กำกับดูแลการจัดการเอกสารด้านค่าใช้จ่ายและภาษี',
  'วางแผน ควบคุม และพัฒนาทีมงาน Sales Administration'
] WHERE employee_id = 163;

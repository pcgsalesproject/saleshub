export const MENU_OPTIONS = [
  { key: "sales_admin", label: "Sales Admin", description: "ข้อมูลและผังทีม Sales Admin" },
  { key: "employees", label: "พนักงาน", description: "รายชื่อและข้อมูลพนักงาน" },
  { key: "assets", label: "ทรัพย์สิน", description: "รายการและรายละเอียดทรัพย์สิน" },
  { key: "assignments", label: "การมอบหมาย", description: "รายการรับและคืนทรัพย์สิน" },
  { key: "asset_history", label: "ประวัติทรัพย์สิน", description: "ประวัติการเปลี่ยนแปลงทรัพย์สิน" },
  { key: "inspection", label: "ตรวจนับ", description: "ตรวจนับและรายงานผลตรวจ" },
] as const;

// Where each menu opens, used to pick a Viewer's landing page.
export const MENU_HOME: Record<(typeof MENU_OPTIONS)[number]["key"], string> = {
  sales_admin: "/sales-admin",
  employees: "/employees/information",
  assets: "/assets",
  assignments: "/assignments",
  asset_history: "/asset-history",
  inspection: "/inspection/summary",
};

export type MenuKey = (typeof MENU_OPTIONS)[number]["key"];
export const ALL_MENU_KEYS = MENU_OPTIONS.map((menu) => menu.key) as MenuKey[];

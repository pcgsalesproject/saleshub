import TeamRoster from "@/components/TeamRoster";
import { getTeamMembers } from "@/lib/actions/org-chart";

const scope = [
  {
    category: "การบริหารจัดการเอกสาร (Document Management)",
    items: [
      "ออกเลขที่เอกสาร",
      "จัดทำและนำส่งเอกสารขออนุมัติ",
      "กระจายเอกสารให้หน่วยงานที่เกี่ยวข้อง",
      "จัดเก็บเอกสารในระบบ E-Document (OneDrive)",
      "ตรวจสอบความถูกต้องของเอกสารก่อนดำเนินการ",
    ],
  },
  {
    category: "การจัดการงบประมาณและค่าใช้จ่าย (Expense & Budget Management)",
    items: [
      "บันทึกและสรุปข้อมูลค่าใช้จ่ายส่งเสริมการขาย (P&L)",
      "จัดทำและส่งข้อมูลรายเดือน",
      "เบิกค่าใช้จ่ายฝ่ายขายผ่านระบบ (RQ, OE, SE)",
      "ตรวจสอบใบแจ้งหนี้และเอกสารประกอบการเบิกจ่าย",
      "ส่งเอกสารให้หน่วยงานบัญชี SSC เพื่อดำเนินการจ่าย",
    ],
  },
  {
    category: "การจัดซื้อและประสานงาน Supplier (Procurement & Vendor Management)",
    items: [
      "เปิด PR / PO ผ่านระบบจัดซื้อ",
      "ขอใบเสนอราคา (Sourcing Request)",
      "รับสินค้าในระบบ (Goods Receipt : GR)",
      "ประสานงานกับ Supplier",
      "จัดทำและแก้ไขข้อมูล Vendor (CV Vendor, MDMs, SSVM)",
    ],
  },
  {
    category: "การประสานงานกับหน่วยงานภายในและภายนอก (Coordination)",
    items: [
      "ประสานงานกับฝ่ายขาย",
      "ประสานงานกับฝ่ายบัญชี SSC",
      "ประสานงานกับ Supplier และหน่วยงานที่เกี่ยวข้อง",
      "ติดตามเอกสารและสถานะการดำเนินงาน",
    ],
  },
  {
    category: "การสนับสนุนงานฝ่ายขาย (Sales Administration Support)",
    items: [
      "สนับสนุนการดำเนินงานของฝ่ายขายในพื้นที่รับผิดชอบ",
      "ให้ข้อมูลและอำนวยความสะดวกแก่ฝ่ายขาย",
      "รับเรื่องจากลูกค้า/Customer Relation และประสานงานต่อ",
    ],
  },
  {
    category: "การสนับสนุนงานโครงการและงานอื่น ๆ (Project & Administrative Support)",
    items: [
      "สนับสนุนงาน Project ตามที่ได้รับมอบหมาย",
      "ดำเนินงานธุรการอื่น ๆ ที่เกี่ยวข้องกับฝ่ายขาย",
      "ให้คำแนะนำหรือถ่ายทอดความรู้ด้านการปฏิบัติงาน",
    ],
  },
];

export default async function AdminTTPage() {
  const members = await getTeamMembers("Admin TT");

  return (
    <TeamRoster
      title="Admin TT"
      subtitle="Support Traditional Trade sales operations and daily activities."
      teamHref="/sales-admin/tt"
      scope={scope}
      members={members}
    />
  );
}

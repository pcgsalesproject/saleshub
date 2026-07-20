import TeamRoster from "@/components/TeamRoster";
import { getTeamMembers } from "@/lib/actions/org-chart";

const scope = [
  {
    category: "บริหารจัดการคำสั่งซื้อ (Order Management)",
    items: [
      "เปิด PO ห้าง",
      "ตรวจสอบคำสั่งซื้อ",
      "แก้ไขข้อมูลคำสั่งซื้อ",
      "ติดตามสถานะคำสั่งซื้อ",
    ],
  },
  {
    category: "ประสานงานการจัดส่งสินค้า (Delivery Coordination)",
    items: [
      "ประสานงานกับฝ่ายขาย (Key Account)",
      "ประสานงานกับ Customer Service",
      "ประสานงานกับคลังสินค้าและฝ่ายขนส่ง",
      "ติดตามการจัดส่งสินค้าให้เป็นไปตามกำหนด",
    ],
  },
  {
    category: "สนับสนุนการดำเนินงานของ Key Account (KA Support)",
    items: [
      "ประสานงานกับ KA",
      "สนับสนุนข้อมูลและเอกสาร",
      "แก้ไขปัญหาที่เกี่ยวข้องกับลูกค้า",
    ],
  },
  {
    category: "บริหารเอกสารค่าใช้จ่ายและส่งเสริมการขาย",
    items: [
      "จัดทำและตรวจสอบเอกสารค่าใช้จ่าย",
      "เอกสารส่งเสริมการขาย",
      "เอกสารลดหนี้ (Credit Note)",
      "เอกสารเบิกจ่าย",
    ],
  },
  {
    category: "ประสานงานกับฝ่ายบัญชีและหน่วยงานที่เกี่ยวข้อง",
    items: [
      "ตรวจสอบเอกสารทางบัญชี",
      "ประสานงานการเบิกจ่าย",
      "ติดตามเอกสารภาษีหัก ณ ที่จ่าย",
      "ติดต่อ DVC/SSC และหน่วยงานภายใน",
    ],
  },
  {
    category: "บริหารข้อมูล Master Data",
    items: [
      "ขอสร้าง/แก้ไข CV Code",
      "ปรับปรุงข้อมูลในระบบ MDMs",
      "ดูแลข้อมูลลูกค้าและข้อมูลอ้างอิงในระบบ",
    ],
  },
  {
    category: "จัดทำและตรวจสอบเอกสารประกอบการดำเนินงาน",
    items: [
      "ตรวจสอบความถูกต้องของเอกสาร",
      "จัดเก็บและส่งต่อเอกสาร",
      "จัดทำรายงานหรือ Log Book",
    ],
  },
  {
    category: "สนับสนุนการดำเนินงานของฝ่ายขาย (Sales Administration Support)",
    items: [
      "สนับสนุนทีม Modern Trade, Trade Marketing และ Pre-Order Sales",
      "ประสานงานกับหน่วยงานภายในและภายนอกบริษัท",
      "แก้ไขปัญหาและอำนวยความสะดวกในการดำเนินงานของฝ่ายขาย",
    ],
  },
];

export default async function AdminMTPage() {
  const members = await getTeamMembers("Admin MT");

  return (
    <TeamRoster
      title="Admin MT"
      subtitle="Support Modern Trade sales operations and daily activities."
      teamHref="/sales-admin/mt"
      scope={scope}
      members={members}
    />
  );
}

import TeamRoster from "@/components/TeamRoster";
import { getTeamMembers } from "@/lib/actions/org-chart";

const scope = [
  {
    category: "Helpdesk & User Support",
    items: [
      "รับเรื่องแจ้งปัญหาและให้ความช่วยเหลือทางด้าน IT",
      "วิเคราะห์และแก้ไขปัญหาเบื้องต้นให้แก่ผู้ใช้งาน",
      "การประสานงานและส่งต่อปัญหาไปยังทีม IT (กลาง)",
      "การแนะนำการใช้งานระบบต่างๆกับทีมฝ่ายขาย",
    ],
  },
  {
    category: "Hardware & Software Support",
    items: [
      "ดูแลอุปกรณ์และซ่อมแซมบำรุงรักษาเบื้องต้น",
      "ดูแลติดตั้ง อัปเดต และแก้ไขปัญหาอุปกรณ์ Hardware และ Software ให้พร้อมใช้งาน",
    ],
  },
  {
    category: "Network & Internet Support",
    items: [
      "ตรวจสอบและบำรุงรักษา รวมถึงอัปเดต Firmware",
      "ดูแลและแก้ไขปัญหาระบบ VPN เพื่อให้พนักงานสามารถเชื่อมต่อเข้ามาทำงานในระบบของบริษัทได้จากนอกบริษัท",
    ],
  },
  {
    category: "Business Applications",
    items: [
      "สนับสนุนระบบงานงานแอปพลิเคชันที่ใช้ในการปฏิบัติงาน อาทิเช่น smartsoft / MIS / Van Sales / EDI / OCR, Microsoft 365 / 2019",
      "ประสานงานระบบกับหน่วยงานที่เกี่ยวข้อง",
    ],
  },
  {
    category: "Other",
    items: [
      "ดูแลการใช้งานระบบสื่อสารของฝ่ายขาย เช่น sim card / mobile device / tablet",
      "คอยสนับสนุนและการแก้ปัญหาการประชุมต่างๆของฝ่ายขาย",
      "คอยสนับสนุนและประสานงานโปรเจคระบบของฝ่ายขายทั้งหมดกับทาง IT",
      "จัดทำงบประมาณประจำปีรวมถึงดูแลตรวจสอบทรัพย์สินและจัดซื้ออุปกรณ์ให้แก่พนักงานฝ่ายขาย",
    ],
  },
];

export default async function SystemAdminPage() {
  const members = await getTeamMembers("System Admin");

  return (
    <TeamRoster
      title="System Admin"
      subtitle="Manage systems, IT infrastructure and user support."
      teamHref="/sales-admin/system"
      scope={scope}
      members={members}
    />
  );
}

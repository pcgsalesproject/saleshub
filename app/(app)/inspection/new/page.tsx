import Link from "next/link";
import sql from "@/lib/db";
import Header from "@/components/Header";
import { getOpenRound } from "@/lib/actions/rounds";
import EmployeeSearch from "./EmployeeSearch";
import RoundBanner from "./RoundBanner";
import InspectionBoard, { type AssignedAsset, type EmployeeDetail } from "./InspectionBoard";

interface EmployeeOption {
  id: number;
  name: string;
  employee_id: string | null;
  email: string | null;
}

async function getEmployees(): Promise<EmployeeOption[]> {
  return sql<EmployeeOption[]>`
    SELECT id, TRIM(CONCAT(prefix_th, ' ', first_name, ' ', last_name)) AS name, employee_id, email
    FROM employees
    WHERE is_active = true
    ORDER BY first_name
  `;
}

async function getEmployeeDetail(id: number): Promise<EmployeeDetail | null> {
  const rows = await sql<EmployeeDetail[]>`
    SELECT e.id, TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS name,
      e.employee_id, p.position AS position_name, d.name AS department_name,
      sa.area_name AS sales_area_name, e.email, e.start_date, e.is_active,
      TRIM(CONCAT(m.prefix_th, ' ', m.first_name, ' ', m.last_name)) AS manager_name
    FROM employees e
    LEFT JOIN positions p ON e.position_id = p.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN sales_areas sa ON e.sales_area_id = sa.id
    LEFT JOIN employees m ON e.manager_id = m.id
    WHERE e.id = ${id}
  `;
  return rows[0] ?? null;
}

async function getAssignedAssets(employeeId: number): Promise<AssignedAsset[]> {
  return sql<AssignedAsset[]>`
    SELECT a.id, a.asset_tag, a.asset_code, a.asset_name, at.name AS asset_type_name, a.serial_number
    FROM asset_assignments aa
    JOIN assets a ON aa.asset_id = a.id
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    WHERE aa.employee_id = ${employeeId} AND aa.returned_at IS NULL
    ORDER BY a.asset_name
  `;
}

export default async function NewInspectionPage(props: PageProps<"/inspection/new">) {
  const { employee_id = "" } = await props.searchParams ?? {};
  const employeeId = String(employee_id);

  const [employees, openRound, [employeeDetail, assignedAssets]] = await Promise.all([
    getEmployees(),
    getOpenRound(),
    employeeId
      ? Promise.all([getEmployeeDetail(Number(employeeId)), getAssignedAssets(Number(employeeId))])
      : Promise.resolve([null, []] as [EmployeeDetail | null, AssignedAsset[]]),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <Header
        title="ตรวจสอบทรัพย์สิน"
        subtitle="ตรวจสอบและยืนยันสถานะทรัพย์สินที่ถูกมอบหมายให้พนักงาน"
        actions={
          <Link
            href="/assets/check"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#102E5A] border border-[#102E5A] rounded-lg px-3.5 py-2 hover:bg-[#eef2fa] transition-colors"
          >
            📱 สแกนทรัพย์สิน
          </Link>
        }
      />

      <RoundBanner round={openRound} />

      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-4">
        <div className="flex items-center gap-3 w-full">
          <label className="text-sm text-gray-500 whitespace-nowrap">เลือกพนักงาน</label>
          <EmployeeSearch employees={employees} />
        </div>
      </div>

      {employeeDetail && (
        <InspectionBoard employee={employeeDetail} assets={assignedAssets} />
      )}
    </div>
  );
}

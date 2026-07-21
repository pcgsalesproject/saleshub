import Link from "next/link";
import sql from "@/lib/db";
import Header from "@/components/Header";
import { getOpenRound } from "@/lib/actions/rounds";
import { getInspectionRows, badgeFor } from "@/lib/inspection";
import RoundBanner from "./RoundBanner";
import InspectionExplorer from "./InspectionExplorer";
import InspectionBoard, { type AssignedAsset, type EmployeeDetail } from "./InspectionBoard";

interface Department {
  id: number;
  name: string;
}

async function getDepartments(): Promise<Department[]> {
  return sql<Department[]>`SELECT id, name FROM departments ORDER BY name`;
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
  const { employee_id = "", department_id = "" } = await props.searchParams ?? {};
  const employeeId = String(employee_id);
  const departmentId = String(department_id);

  const [departments, openRound, [employeeDetail, assignedAssets]] = await Promise.all([
    getDepartments(),
    getOpenRound(),
    employeeId
      ? Promise.all([getEmployeeDetail(Number(employeeId)), getAssignedAssets(Number(employeeId))])
      : Promise.resolve([null, []] as [EmployeeDetail | null, AssignedAsset[]]),
  ]);

  const rows = await getInspectionRows(
    departmentId ? Number(departmentId) : null,
    openRound?.id ?? null
  );

  const stats = rows.reduce(
    (acc, r) => {
      const badge = badgeFor(r);
      if (badge !== "none") acc.checked += 1;
      if (badge === "problem") acc.problem += 1;
      if (badge === "none") acc.none += 1;
      return acc;
    },
    { total: rows.length, checked: 0, problem: 0, none: 0 }
  );

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

      <RoundBanner round={openRound} stats={stats} />

      {employeeDetail ? (
        <InspectionBoard employee={employeeDetail} assets={assignedAssets} />
      ) : (
        <InspectionExplorer rows={rows} departments={departments} departmentId={departmentId} />
      )}
    </div>
  );
}

import Link from "next/link";
import sql from "@/lib/db";
import Header from "@/components/Header";
import { getOpenRound } from "@/lib/actions/rounds";
import { getInspectionRows, badgeFor, type InspectionBadge } from "@/lib/inspection";
import EmployeeSearch from "./EmployeeSearch";
import RoundBanner from "./RoundBanner";
import DepartmentFilter from "./DepartmentFilter";
import InspectionBoard, { type AssignedAsset, type EmployeeDetail } from "./InspectionBoard";

interface EmployeeOption {
  id: number;
  name: string;
  employee_id: string | null;
  email: string | null;
}

interface Department {
  id: number;
  name: string;
}

const BADGE_META: Record<InspectionBadge, { label: string; cls: string; action: string }> = {
  ok: { label: "ตรวจแล้ว", cls: "bg-green-50 text-green-700 border-green-200", action: "ดู" },
  problem: { label: "พบปัญหา", cls: "bg-red-50 text-red-700 border-red-200", action: "ดู" },
  partial: { label: "ตรวจบางส่วน", cls: "bg-yellow-50 text-yellow-700 border-yellow-200", action: "ทำต่อ" },
  none: { label: "ยังไม่ตรวจ", cls: "bg-gray-50 text-gray-500 border-gray-200", action: "ตรวจเลย" },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function formatCheckDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

async function getEmployees(): Promise<EmployeeOption[]> {
  return sql<EmployeeOption[]>`
    SELECT id, TRIM(CONCAT(prefix_th, ' ', first_name, ' ', last_name)) AS name, employee_id, email
    FROM employees
    WHERE is_active = true
    ORDER BY first_name
  `;
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

  const [employees, departments, openRound, [employeeDetail, assignedAssets]] = await Promise.all([
    getEmployees(),
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
          <DepartmentFilter departments={departments} departmentId={departmentId} />
        </div>
      </div>

      {employeeDetail ? (
        <InspectionBoard employee={employeeDetail} assets={assignedAssets} />
      ) : (
      /* Employee table */
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          รายชื่อพนักงาน
        </h2>
        {rows.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">ไม่มีข้อมูล</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">พนักงาน</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ฝ่าย</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">สถานะ</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ผลทรัพย์สิน</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">วันที่ตรวจ</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const badge = badgeFor(r);
                const meta = BADGE_META[badge];
                return (
                  <tr key={r.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[#eef2fa] text-[#102E5A] text-xs font-semibold flex-shrink-0">
                          {getInitials(r.name)}
                        </span>
                        <div>
                          <p className="font-medium text-gray-800">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.position_name ?? "—"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{r.department_name ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 border ${meta.cls}`}>
                        {meta.label}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-xs text-gray-500">
                      {r.checked_assets === 0 ? "—" : (
                        <>
                          พบ ×{r.found_count}
                          {r.damaged_count > 0 && `, เสียหาย ×${r.damaged_count}`}
                          {r.missing_count > 0 && `, ไม่พบ ×${r.missing_count}`}
                        </>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{formatCheckDate(r.last_checked_at)}</td>
                    <td className="py-3 text-right">
                      <Link
                        href={`/inspection/new?employee_id=${r.id}`}
                        className="text-xs font-medium text-[#102E5A] border border-[#102E5A] rounded-lg px-2.5 py-1 hover:bg-[#eef2fa] transition-colors"
                      >
                        {meta.action}
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      )}
    </div>
  );
}

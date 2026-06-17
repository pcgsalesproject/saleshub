import Link from "next/link";
import Header from "@/components/Header";
import sql from "@/lib/db";

interface AssignmentRow {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  asset_type_name: string | null;
  employee_id: number;
  employee_id_str: string;
  employee_name: string;
  department_name: string | null;
  assigned_at: string | null;
  returned_at: string | null;
}

async function getAssignments(status: string): Promise<AssignmentRow[]> {
  const cond = status === "returned"
    ? sql`AND aa.returned_at IS NOT NULL`
    : status === "active"
    ? sql`AND aa.returned_at IS NULL`
    : sql``;

  return sql<AssignmentRow[]>`
    SELECT
      aa.id,
      a.id AS asset_id, a.asset_tag, a.asset_name,
      at.name AS asset_type_name,
      e.id AS employee_id, e.employee_id AS employee_id_str,
      TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS employee_name,
      d.name AS department_name,
      aa.assigned_at, aa.returned_at
    FROM asset_assignments aa
    JOIN assets a ON aa.asset_id = a.id
    JOIN employees e ON aa.employee_id = e.id
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE 1=1 ${cond}
    ORDER BY aa.assigned_at DESC
  `;
}

function formatDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default async function AssignmentsPage(props: PageProps<"/assignments">) {
  const { status = "active" } = await props.searchParams ?? {};
  const rows = await getAssignments(String(status));

  const tabs = [
    { key: "active", label: "กำลังใช้งาน" },
    { key: "returned", label: "คืนแล้ว" },
    { key: "", label: "ทั้งหมด" },
  ];

  return (
    <div>
      <Header title="Assignments" subtitle="Asset Assignment Records" />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-4 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key ? `/assignments?status=${t.key}` : "/assignments?status="}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              String(status) === t.key
                ? "bg-[#102E5A] text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {rows.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">ไม่พบข้อมูล</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">ทรัพย์สิน</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">พนักงาน</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">ฝ่าย</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">วันที่รับ</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">วันที่คืน</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3">สถานะ</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <Link href={`/assets/${r.asset_id}`} className="font-semibold text-gray-800 hover:text-[#102E5A] hover:underline block">
                      {r.asset_name}
                    </Link>
                    <span className="text-xs text-gray-400 font-mono">{r.asset_tag}</span>
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/employees/${r.employee_id}?tab=assignments`} className="font-medium text-gray-800 hover:text-[#102E5A] hover:underline block">
                      {r.employee_name}
                    </Link>
                    <span className="text-xs text-gray-400">{r.employee_id_str}</span>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{r.department_name ?? "—"}</td>
                  <td className="px-5 py-3.5 text-gray-600">{formatDate(r.assigned_at)}</td>
                  <td className="px-5 py-3.5 text-gray-600">{formatDate(r.returned_at)}</td>
                  <td className="px-5 py-3.5">
                    {r.returned_at ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 bg-gray-100 rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                        คืนแล้ว
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        กำลังใช้งาน
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

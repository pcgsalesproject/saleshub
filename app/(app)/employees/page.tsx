import Link from "next/link";
import pool from "@/lib/db";
import type { Employee } from "@/lib/types";
import Header from "@/components/Header";
import DeleteButton from "./DeleteButton";
import s from "./page.module.css";

async function getEmployees(search: string): Promise<Employee[]> {
  const like = `%${search}%`;
  const [rows] = await pool.execute(
    `SELECT e.*, d.name AS department_name, p.position AS position_name
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.id
     LEFT JOIN positions   p ON e.position_id   = p.id
     WHERE e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ? OR e.email LIKE ?
     ORDER BY e.created_at DESC`,
    [like, like, like, like]
  );
  return rows as Employee[];
}

const statusBadge: Record<string, string> = {
  Active:   "badge badge-active",
  Inactive: "badge badge-inactive",
  Resigned: "badge badge-resigned",
};

export default async function EmployeesPage(props: PageProps<"/employees">) {
  const { search = "" } = await props.searchParams ?? {};
  const employees = await getEmployees(String(search));

  return (
    <div>
      <Header
        title="พนักงาน"
        subtitle={`${employees.length} รายการ`}
        actions={
          <Link href="/employees/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            เพิ่มพนักงาน
          </Link>
        }
      />

      {/* Search */}
      <form>
        <div className={s.searchWrap}>
          <svg className={s.searchIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            name="search"
            defaultValue={String(search)}
            placeholder="ค้นหาชื่อ, รหัสพนักงาน, อีเมล…"
            className={s.searchInput}
          />
        </div>
      </form>

      {/* Table */}
      <div className="table-wrap">
        <table className="table-base">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className={`th ${s.colId}`}>รหัสพนักงาน</th>
              <th className={`th ${s.colName}`}>ชื่อ-นามสกุล</th>
              <th className={`th ${s.colDept}`}>ฝ่าย</th>
              <th className={`th ${s.colPosition}`}>ตำแหน่ง</th>
              <th className={`th ${s.colEmail}`}>อีเมล</th>
              <th className={`th ${s.colPhone}`}>เบอร์โทร</th>
              <th className={`th ${s.colStatus}`}>สถานะ</th>
              <th className={`th ${s.colActions}`}></th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                  ไม่พบข้อมูลพนักงาน
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="tr-body">
                  <td className={`td font-mono text-xs ${s.colId}`}>{emp.employee_id}</td>
                  <td className={`td font-medium text-gray-900 ${s.colName}`}>
                    {emp.full_name ?? `${emp.first_name} ${emp.last_name}`}
                  </td>
                  <td className={`td ${s.colDept}`}>{emp.department_name ?? "—"}</td>
                  <td className={`td ${s.colPosition}`}>{emp.position_name ?? "—"}</td>
                  <td className={`td ${s.colEmail}`}>{emp.email ?? "—"}</td>
                  <td className={`td ${s.colPhone}`}>{emp.phone ?? "—"}</td>
                  <td className={`td ${s.colStatus}`}>
                    <span className={statusBadge[emp.status] ?? "badge"}>
                      {emp.status}
                    </span>
                  </td>
                  <td className={`td ${s.colActions}`}>
                    <div className="inline-flex items-center gap-2">
                      <Link href={`/employees/${emp.id}/edit`} className="btn-outline">
                        แก้ไข
                      </Link>
                      <DeleteButton id={emp.id} name={`${emp.first_name} ${emp.last_name}`} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

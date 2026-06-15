import Link from "next/link";
import sql from "@/lib/db";
import type { Employee } from "@/lib/types";
import Header from "@/components/Header";
import s from "./page.module.css";

async function getEmployees(search: string): Promise<Employee[]> {
  const like = `%${search}%`;
  return sql<Employee[]>`
    SELECT e.*, d.name AS department_name, p.position AS position_name,
           sa.name AS sales_area_name
    FROM employees e
    LEFT JOIN departments d  ON e.department_id  = d.id
    LEFT JOIN positions   p  ON e.position_id    = p.id
    LEFT JOIN sales_areas sa ON e.sales_area_id  = sa.id
    WHERE e.first_name ILIKE ${like} OR e.last_name ILIKE ${like}
       OR e.employee_id ILIKE ${like} OR e.email ILIKE ${like}
    ORDER BY e.created_at DESC
  `;
}

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
                    {[emp.prefix_th, emp.first_name, emp.last_name].filter(Boolean).join(" ")}
                  </td>
                  <td className={`td ${s.colDept}`}>{emp.department_name ?? "—"}</td>
                  <td className={`td ${s.colPosition}`}>{emp.position_name ?? "—"}</td>
                  <td className={`td ${s.colEmail}`}>{emp.email ?? "—"}</td>
                  <td className={`td ${s.colPhone}`}>{emp.phone ?? "—"}</td>
                  <td className={`td ${s.colStatus}`}>
                    <span className={emp.is_active ? "badge badge-active" : "badge badge-inactive"}>
                      {emp.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className={`td ${s.colActions}`}>
                    <Link href={`/employees/${emp.id}`} className="btn-outline">
                      ดูข้อมูลเพิ่มเติม
                    </Link>
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

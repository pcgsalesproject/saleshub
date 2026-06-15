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

function Initials({ name }: { name: string }) {
  const parts = name.trim().split(" ");
  const letters = parts.length >= 2
    ? parts[0][0] + parts[parts.length - 1][0]
    : parts[0].slice(0, 2);
  return (
    <div className={s.avatar}>
      {letters.toUpperCase()}
    </div>
  );
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

      {/* Cards */}
      {employees.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">ไม่พบข้อมูลพนักงาน</p>
      ) : (
        <div className={s.grid}>
          {employees.map((emp) => {
            const fullName = [emp.prefix_th, emp.first_name, emp.last_name].filter(Boolean).join(" ");
            return (
              <Link key={emp.id} href={`/employees/${emp.id}`} className={s.card}>
                {/* Centered: avatar, name, position, badge */}
                <div className={s.cardTop}>
                  <Initials name={`${emp.first_name} ${emp.last_name}`} />
                  <p className={s.name}>{fullName}</p>
                  <p className={s.position}>{emp.position_name ?? "—"}</p>
                  <span className={emp.is_active ? "badge badge-active" : "badge badge-inactive"}>
                    {emp.is_active ? "Active" : "Inactive"}
                  </span>
                </div>

                <hr className={s.divider} />

                {/* Info rows */}
                <div className={s.cardInfo}>
                  <div className={s.infoRow}>
                    <svg className={s.infoIcon} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                    </svg>
                    <span>{emp.phone ?? "—"}</span>
                  </div>
                  <div className={s.infoRow}>
                    <svg className={s.infoIcon} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
                    </svg>
                    <span>{emp.department_name ?? "—"}</span>
                  </div>
                  <div className={s.infoRow}>
                    <svg className={s.infoIcon} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    <span>{emp.sales_area_name ?? "—"}</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

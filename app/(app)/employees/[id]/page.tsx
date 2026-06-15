import Link from "next/link";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import type { Employee } from "@/lib/types";
import DeleteButton from "../DeleteButton";
import s from "./page.module.css";

interface AssignedAsset {
  id: number;
  asset_name: string;
  asset_code: string | null;
  assigned_at: string | null;
}

async function getAssignedAssets(employeeId: number): Promise<AssignedAsset[]> {
  return sql<AssignedAsset[]>`
    SELECT aa.id, a.asset_name, a.asset_code, aa.assigned_at
    FROM asset_assignments aa
    JOIN assets a ON aa.asset_id = a.id
    WHERE aa.employee_id = ${employeeId} AND aa.returned_at IS NULL
    ORDER BY aa.assigned_at DESC
  `;
}

async function getEmployee(id: number): Promise<Employee | null> {
  const rows = await sql<Employee[]>`
    SELECT e.*, d.name AS department_name, p.position AS position_name,
           sa.name AS sales_area_name
    FROM   employees e
    LEFT JOIN departments d  ON e.department_id = d.id
    LEFT JOIN positions   p  ON e.position_id   = p.id
    LEFT JOIN sales_areas sa ON e.sales_area_id = sa.id
    WHERE e.id = ${id}
  `;
  return rows[0] ?? null;
}

function formatPhone(v?: string | null) {
  const d = (v ?? "").replace(/\D/g, "");
  if (d.length !== 10) return v;
  return `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}`;
}

function formatNationalId(v?: string | null) {
  const d = (v ?? "").replace(/\D/g, "");
  if (d.length !== 13) return v;
  return `${d[0]}-${d.slice(1, 5)}-•••••-${d.slice(10, 12)}-${d[12]}`;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className={s.field}>
      <span className={s.fieldLabel}>{label}</span>
      <span className={s.fieldValue}>{value || "—"}</span>
    </div>
  );
}

export default async function EmployeeDetailPage(props: PageProps<"/employees/[id]">) {
  const { id } = await props.params;
  const [employee, assets] = await Promise.all([
    getEmployee(Number(id)),
    getAssignedAssets(Number(id)),
  ]);

  if (!employee) notFound();

  const fullName = [employee.prefix_th, employee.first_name, employee.last_name].filter(Boolean).join(" ");
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();

  const now = new Date();
  const start = new Date(employee.created_at);
  const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
  const tenureYears = Math.floor(totalMonths / 12);
  const tenureMonths = totalMonths % 12;
  const tenureText = tenureYears > 0 ? `${tenureYears} ปี ${tenureMonths} ด.` : `${tenureMonths} ด.`;

  return (
    <div className={s.layout}>

      {/* ── Sidebar ── */}
      <aside className={s.sidebar}>
        <div className={s.sidebarTop}>
          <div className={s.avatar}>{initials}</div>
          <p className={s.sidebarName}>{fullName}</p>
          <p className={s.sidebarPosition}>{employee.position_name ?? "—"}</p>
          <span className={employee.is_active ? "badge badge-active" : "badge badge-inactive"}>
            {employee.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* KPI cards */}
        <div className={s.kpiWrap}>
          <div className={s.kpiCard}>
            <div className={`${s.kpiIcon} ${s.kpiIconBlue}`}>
              <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
              </svg>
            </div>
            <div>
              <p className={s.kpiValue}>{assets.length}</p>
              <p className={s.kpiLabel}>ทรัพย์สินที่ถือครอง</p>
            </div>
          </div>
          <div className={s.kpiCard}>
            <div className={`${s.kpiIcon} ${s.kpiIconGreen}`}>
              <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className={s.kpiValue}>{tenureText}</p>
              <p className={s.kpiLabel}>อายุงาน</p>
            </div>
          </div>
        </div>

        <nav className={s.nav}>
          <div className={`${s.navItem} ${s.navItemActive}`}>
            <svg className={s.navIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            ข้อมูลส่วนตัว
          </div>
          <div className={s.navItem}>
            <svg className={s.navIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            มอบหมายทรัพย์สิน
          </div>
        </nav>

      </aside>

      {/* ── Main content ── */}
      <main className={s.main}>

        {/* ข้อมูลส่วนตัว */}
        <div className={s.sectionCard}>
          <div className={s.sectionHeader}>
            <h2 className={s.sectionTitle}>ข้อมูลส่วนตัว</h2>
            <div className="flex items-center gap-2">
              <Link href={`/employees/${employee.id}/edit`} className="btn-outline">แก้ไข</Link>
              <DeleteButton id={employee.id} name={fullName} />
            </div>
          </div>
          <div className={s.nameRow}>
            <div className={s.prefixCol}><Field label="คำนำหน้า" value={employee.prefix_th} /></div>
            <div className={s.nameCol}><Field label="ชื่อ" value={employee.first_name} /></div>
            <div className={s.nameCol}><Field label="นามสกุล" value={employee.last_name} /></div>
          </div>
          <div className={s.nameRow}>
            <div className={s.prefixCol}><Field label="Prefix" value={employee.prefix_en} /></div>
            <div className={s.nameCol}><Field label="Name" value={employee.first_name_en} /></div>
            <div className={s.nameCol}><Field label="Lastname" value={employee.last_name_en} /></div>
          </div>
          <div className={s.grid}>
            <Field label="วันเกิด" value={employee.date_of_birth ? new Date(employee.date_of_birth).toLocaleDateString("th-TH") : undefined} />
            <Field label="เลขบัตรประชาชน" value={formatNationalId(employee.national_id)} />
          </div>
        </div>

        {/* ข้อมูลติดต่อ */}
        <div className={s.sectionCard}>
          <h2 className={s.sectionTitle}>ข้อมูลติดต่อ</h2>
          <div className={s.grid}>
            <Field label="อีเมล" value={employee.email} />
            <Field label="เบอร์โทรศัพท์" value={formatPhone(employee.phone)} />
          </div>
        </div>

        {/* ข้อมูลการทำงาน */}
        <div className={s.sectionCard}>
          <h2 className={s.sectionTitle}>ข้อมูลการทำงาน</h2>
          <div className={s.grid}>
            <Field label="รหัสพนักงาน" value={employee.employee_id} />
            <Field label="สถานะ" value={employee.is_active ? "Active" : "Inactive"} />
            <Field label="ฝ่าย" value={employee.department_name} />
            <Field label="ตำแหน่ง" value={employee.position_name} />
            <Field label="เขตการขาย" value={employee.sales_area_name} />
          </div>
        </div>

        {/* ทรัพย์สินที่มอบหมาย */}
        <div className={s.sectionCard}>
          <div className={s.assetHeader}>
            <h2 className={s.sectionTitle}>ทรัพย์สินที่มอบหมาย</h2>
            <span className={s.assetCount}>{assets.length} รายการ</span>
          </div>
          {assets.length === 0 ? (
            <p className={s.assetEmpty}>ยังไม่มีทรัพย์สินที่มอบหมาย</p>
          ) : (
            <div className={s.assetList}>
              {assets.map((asset) => (
                <div key={asset.id} className={s.assetItem}>
                  <div className={s.assetIcon}>
                    <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-5 h-5 text-gray-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                    </svg>
                  </div>
                  <div className={s.assetInfo}>
                    <p className={s.assetName}>{asset.asset_name}</p>
                    <p className={s.assetCode}>{asset.asset_code ?? "—"}</p>
                  </div>
                  <span className={s.assetDate}>
                    {asset.assigned_at
                      ? new Date(asset.assigned_at).toLocaleDateString("th-TH", { day: "2-digit", month: "short", year: "numeric" })
                      : "—"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

      </main>

    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import type { Employee } from "@/lib/types";
import s from "./page.module.css";
import { returnAssetFromEmployee } from "@/lib/actions/assets";
import { getCurrentRole } from "@/lib/roles";
import ReturnAssetForm from "@/components/ReturnAssetForm";
import EmployeeAvatar from "./EmployeeAvatar";
import CopyableField from "./CopyableField";
import KpiCards from "./KpiCards";

interface AssignedAsset {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  asset_code: string | null;
  serial_number: string | null;
  phone_number: string | null;
  asset_type_name: string | null;
  assigned_at: string | null;
  returned_at: string | null;
}

async function getAssignedAssets(employeeId: number): Promise<AssignedAsset[]> {
  return sql<AssignedAsset[]>`
    SELECT aa.id, a.id AS asset_id, a.asset_tag, a.asset_name, a.asset_code, a.serial_number, a.phone_number,
           at.name AS asset_type_name, aa.assigned_at, aa.returned_at
    FROM asset_assignments aa
    JOIN assets a ON aa.asset_id = a.id
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    WHERE aa.employee_id = ${employeeId}
    ORDER BY aa.assigned_at DESC
  `;
}

async function getEmployee(id: number): Promise<Employee | null> {
  const rows = await sql<Employee[]>`
    SELECT e.*, d.name AS department_name, p.position AS position_name,
           sa.area_name AS sales_area_name,
           TRIM(CONCAT(m.prefix_th, ' ', m.first_name, ' ', m.last_name)) AS manager_name
    FROM   employees e
    LEFT JOIN departments d  ON e.department_id = d.id
    LEFT JOIN positions   p  ON e.position_id   = p.id
    LEFT JOIN sales_areas sa ON e.sales_area_id = sa.id
    LEFT JOIN employees   m  ON e.manager_id    = m.id
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
  return `${d[0]}-${d.slice(1, 5)}-${d.slice(5, 10)}-${d.slice(10, 12)}-${d[12]}`;
}

function formatDate(v?: string | Date | null) {
  if (!v) return undefined;
  const d = new Date(v);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

function FieldRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className={s.fieldRow}>
      <span className={s.fieldRowLabel}>{label}</span>
      <span className={s.fieldRowValue}>{value || "—"}</span>
    </div>
  );
}

export default async function EmployeeDetailPage(props: PageProps<"/employees/[id]">) {
  const { id } = await props.params;
  const { tab = "profile" } = await props.searchParams ?? {};

  const [employee, allAssets, role] = await Promise.all([
    getEmployee(Number(id)),
    getAssignedAssets(Number(id)),
    getCurrentRole(),
  ]);

  if (!employee) notFound();

  const canViewSensitive = role === "admin";

  const currentAssets = allAssets.filter((a) => !a.returned_at);
  const historyAssets = allAssets.filter((a) => a.returned_at);

  const isAssignTab = tab === "assignments";

  const fullName = [employee.prefix_th, employee.first_name, employee.last_name].filter(Boolean).join(" ");
  const fullNameEn = [employee.prefix_en, employee.first_name_en, employee.last_name_en].filter(Boolean).join(" ");
  const initials = `${employee.first_name[0]}${employee.last_name[0]}`.toUpperCase();

  let age: number | null = null;
  if (employee.date_of_birth) {
    const dob = new Date(employee.date_of_birth);
    const today = new Date();
    age = today.getFullYear() - dob.getFullYear();
    const beforeBirthday = today.getMonth() < dob.getMonth() ||
      (today.getMonth() === dob.getMonth() && today.getDate() < dob.getDate());
    if (beforeBirthday) age--;
  }

  const now = new Date();
  let tenureText = "—";
  if (employee.start_date) {
    const start = new Date(employee.start_date);
    const totalMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
    const tenureYears = Math.floor(totalMonths / 12);
    const tenureMonths = totalMonths % 12;
    tenureText = totalMonths < 1 ? "< 1 เดือน"
      : tenureYears > 0 ? `${tenureYears} ปี ${tenureMonths} เดือน`
      : `${tenureMonths} เดือน`;
  }

  return (
    <div className={s.pageWrap}>

      {/* ── Breadcrumb ── */}
      <div className={s.breadcrumbRow}>
        <div className={s.breadcrumbNav}>
          <Link href="/employees/information" className={s.breadcrumbLink}>Employees</Link>
          <span className={s.breadcrumbSep}>›</span>
          <span className={s.breadcrumbCurrent}>{fullName}</span>
        </div>
        <div className={s.headerActions}>
          <Link href="/employees/information" className={s.backBtn}>
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            กลับไปรายชื่อ
          </Link>
          <Link href={`/employees/${employee.id}/edit`} className="btn-primary">
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            แก้ไขข้อมูล
          </Link>
        </div>
      </div>

    <div className={s.layout}>

      {/* ── Sidebar ── */}
      <aside className={s.sidebar}>
        <div className={s.sidebarTop}>
          <EmployeeAvatar employeeId={employee.id} photoUrl={employee.photo_url} initials={initials} />
          <p className={s.sidebarName}>{fullName}</p>
          <p className={s.sidebarPosition}>{employee.position_name ?? "—"}</p>
          <span className={employee.is_active ? "badge badge-active" : "badge badge-inactive"}>
            {employee.is_active ? "Active" : "Inactive"}
          </span>
        </div>

        {/* KPI cards */}
        <KpiCards
          tenureText={tenureText}
          startDate={formatDate(employee.start_date) ?? null}
          assets={currentAssets.map((a) => ({
            id: a.id,
            asset_id: a.asset_id,
            asset_name: a.asset_name,
            asset_type_name: a.asset_type_name,
            serial_number: a.serial_number,
            phone_number: a.phone_number,
            assigned_at: formatDate(a.assigned_at) ?? null,
          }))}
        />

        <nav className={s.nav}>
          <Link href={`/employees/${employee.id}`} className={`${s.navItem} ${!isAssignTab ? s.navItemActive : ""}`}>
            <svg className={s.navIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            ข้อมูลส่วนตัว
          </Link>
          <Link href={`/employees/${employee.id}?tab=assignments`} className={`${s.navItem} ${isAssignTab ? s.navItemActive : ""}`}>
            <svg className={s.navIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            มอบหมายทรัพย์สิน
          </Link>
        </nav>

      </aside>

      {/* ── Main content ── */}
      <main className={s.main}>

        {!isAssignTab ? (<>
          {/* ── Tab: ข้อมูลส่วนตัว ── */}
          <div className={s.twoCol}>
            <div className={`${s.sectionCard} ${s.sectionCardTall}`}>
              <h2 className={s.sectionTitle}><span className={s.titleDot} />ข้อมูลส่วนตัว</h2>
              <FieldRow label="ชื่อ-นามสกุล" value={fullName} />
              <FieldRow label="Name (English)" value={fullNameEn} />
              {canViewSensitive ? (
                <CopyableField label="เลขบัตรประชาชน" value={formatNationalId(employee.national_id)} />
              ) : (
                <FieldRow label="เลขบัตรประชาชน" value={employee.national_id ? "•••-••••-•••••-••-•" : undefined} />
              )}
              <FieldRow label="วันเกิด" value={canViewSensitive ? formatDate(employee.date_of_birth) : undefined} />
              <FieldRow label="อายุ" value={age !== null ? `${age} ปี` : undefined} />
            </div>
            <div className={`${s.sectionCard} ${s.sectionCardTall}`}>
              <h2 className={s.sectionTitle}><span className={s.titleDot} />ข้อมูลการทำงาน</h2>
              <FieldRow label="รหัสพนักงาน" value={employee.employee_id} />
              <div className={s.fieldRow}>
                <span className={s.fieldRowLabel}>สถานะ</span>
                <span className={s.statusValue}>
                  <span className={employee.is_active ? s.statusDotGreen : s.statusDotGray} />
                  {employee.is_active ? "Active" : "Inactive"}
                </span>
              </div>
              <FieldRow label="ฝ่าย" value={employee.department_name} />
              <FieldRow label="ตำแหน่ง" value={employee.position_name} />
              <FieldRow label="เขตการขาย" value={employee.sales_area_name} />
            </div>
          </div>
          <div className={s.twoCol}>
            <div className={s.sectionCard}>
              <h2 className={s.sectionTitle}><span className={s.titleDot} />ข้อมูลติดต่อ</h2>
              <FieldRow label="อีเมล" value={employee.email} />
              <FieldRow label="เบอร์โทรศัพท์" value={formatPhone(employee.phone)} />
            </div>
            <div className={s.sectionCard}>
              <h2 className={s.sectionTitle}><span className={s.titleDot} />สายบังคับบัญชา</h2>
              <FieldRow label="ผู้บังคับบัญชา" value={employee.manager_name} />
            </div>
          </div>
        </>) : (<>
          {/* ── Tab: มอบหมายทรัพย์สิน ── */}

          {/* ถือครองอยู่ */}
          <div className={s.sectionCard}>
            <div className={s.assetHeader}>
              <h2 className={s.sectionTitle}><span className={s.titleDot} />ถือครองอยู่</h2>
              <span className={s.assetCount}>{currentAssets.length} รายการ</span>
            </div>
            {currentAssets.length === 0 ? (
              <p className={s.assetEmpty}>ไม่มีทรัพย์สินที่ถือครองอยู่</p>
            ) : (
              <div className={s.assetList}>
                {currentAssets.map((a) => {
                  const returnAction = returnAssetFromEmployee.bind(null, a.id, employee.id);
                  return (
                    <div key={a.id} className={s.assetItem}>
                      <div className={s.assetIcon}>
                        <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-5 h-5 text-gray-500">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                        </svg>
                      </div>
                      <div className={s.assetInfo}>
                        <Link href={`/assets/${a.asset_id}`} className="hover:text-[#102E5A] hover:underline">
                          <p className={s.assetName}>{a.asset_name}</p>
                        </Link>
                        <p className={s.assetCode}>Type: {a.asset_type_name ?? "—"}</p>
                        <p className={s.assetCode}>Serial Number: {a.serial_number ?? "—"}</p>
                        <p className={s.assetCode}>หมายเลข: {a.phone_number ?? "—"}</p>
                      </div>
                      <span className={s.assetDate}>รับ {formatDate(a.assigned_at)}</span>
                      <ReturnAssetForm
                        action={returnAction}
                        employeeName={fullName}
                        assetName={a.asset_name}
                        assetTypeName={a.asset_type_name}
                        serialNumber={a.serial_number}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ประวัติ */}
          <div className={s.sectionCard}>
            <div className={s.assetHeader}>
              <h2 className={s.sectionTitle}><span className={s.titleDot} />ประวัติการใช้งาน</h2>
              <span className={s.assetCount}>{historyAssets.length} รายการ</span>
            </div>
            {historyAssets.length === 0 ? (
              <p className={s.assetEmpty}>ยังไม่มีประวัติการคืนทรัพย์สิน</p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ทรัพย์สิน</th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">วันที่รับ</th>
                    <th className="text-left text-xs font-medium text-gray-400 pb-2">วันที่คืน</th>
                  </tr>
                </thead>
                <tbody>
                  {historyAssets.map((a) => (
                    <tr key={a.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4">
                        <Link href={`/assets/${a.asset_id}`} className="font-medium text-gray-800 hover:text-[#102E5A] hover:underline">
                          {a.asset_name}
                        </Link>
                        <p className="text-xs text-gray-400 mt-0.5">Type: {a.asset_type_name ?? "—"}</p>
                        <p className="text-xs text-gray-400">Serial Number: {a.serial_number ?? "—"}</p>
                        <p className="text-xs text-gray-400">หมายเลข: {a.phone_number ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600">{formatDate(a.assigned_at)}</td>
                      <td className="py-3 text-gray-600">{formatDate(a.returned_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>)}

      </main>

    </div>
    </div>
  );
}

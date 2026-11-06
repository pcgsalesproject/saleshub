import Link from "next/link";
import { getManagedUsers, toggleUserActive } from "@/lib/actions/user-access";

type Params = { q?: string; role?: string; dept?: string; status?: string; page?: string; size?: string };

const SIZES = [10, 25, 50];
const dateFmt = new Intl.DateTimeFormat("th-TH", {
  day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Bangkok",
});

function RoleBadge({ role }: { role: string }) {
  const admin = role === "admin";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-medium ${admin ? "bg-blue-50 text-blue-700" : "bg-gray-100 text-gray-600"}`}>
      {admin ? "Admin" : "Viewer"}
    </span>
  );
}

function StatusBadge({ disabled }: { disabled: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${disabled ? "bg-gray-100 text-gray-600" : "bg-green-50 text-green-700"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${disabled ? "bg-gray-400" : "bg-green-500"}`} />
      {disabled ? "ปิดใช้งาน" : "ใช้งานอยู่"}
    </span>
  );
}

export default async function UsersPage({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const role = params.role ?? "";
  const dept = params.dept ?? "";
  const status = params.status ?? "";
  const size = SIZES.includes(Number(params.size)) ? Number(params.size) : 10;

  const all = await getManagedUsers();
  const departments = [...new Set(all.map((u) => u.department).filter((d): d is string => Boolean(d)))].sort();

  const filtered = all.filter((u) => {
    if (q && ![u.username, u.email, u.full_name, u.employee_code].some((v) => v?.toLowerCase().includes(q))) return false;
    if (role && u.role !== role) return false;
    if (dept && u.department !== dept) return false;
    if (status === "active" && !u.is_active) return false;
    if (status === "disabled" && !!u.is_active) return false;
    return true;
  });

  const pages = Math.max(1, Math.ceil(filtered.length / size));
  const page = Math.min(Math.max(1, Number(params.page) || 1), pages);
  const rows = filtered.slice((page - 1) * size, page * size);
  const from = filtered.length === 0 ? 0 : (page - 1) * size + 1;

  const hrefFor = (overrides: Partial<Params>) => {
    const next = new URLSearchParams();
    const merged: Params = { q: params.q, role, dept, status, size: String(size), ...overrides };
    for (const [k, v] of Object.entries(merged)) if (v) next.set(k, v);
    return `/settings/users?${next.toString()}`;
  };

  return (
    <div>
      <nav className="mb-3 text-sm text-gray-500">
        <Link href="/settings" className="hover:underline">Settings</Link> &gt;{" "}
        <span className="font-medium text-gray-800">User Management</span>
      </nav>

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">User Management</h1>
          <p className="mt-1 text-sm text-gray-500">จัดการบัญชีผู้ใช้งาน ดูสิทธิ์ กำหนดบทบาท และสถานะการใช้งาน</p>
        </div>
        <Link href="/settings/users/new" className="rounded-lg bg-[#102E5A] px-4 py-2 text-center text-sm font-medium text-white hover:bg-[#173d73]">
          + เพิ่มผู้ใช้
        </Link>
      </div>

      <form method="get" className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_auto]">
        <input type="hidden" name="size" value={size} />
        <input name="q" defaultValue={params.q} className="input w-full" placeholder="ค้นหา ชื่อ, username, อีเมล หรือรหัสพนักงาน" />
        <select name="role" defaultValue={role} className="input w-full" aria-label="บทบาท">
          <option value="">บทบาท: ทั้งหมด</option>
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
        <select name="dept" defaultValue={dept} className="input w-full" aria-label="แผนก">
          <option value="">แผนก: ทั้งหมด</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <select name="status" defaultValue={status} className="input w-full" aria-label="สถานะ">
          <option value="">สถานะ: ทั้งหมด</option>
          <option value="active">ใช้งานอยู่</option>
          <option value="disabled">ปิดใช้งาน</option>
        </select>
        <div className="flex gap-2">
          <button type="submit" className="rounded-lg bg-[#102E5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#173d73]">ค้นหา</button>
          <Link href="/settings/users" className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">ล้าง</Link>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-gray-50 text-xs font-semibold text-gray-600">
            <tr>
              <th className="px-4 py-3">ชื่อ-นามสกุล</th>
              <th className="px-4 py-3">Username / อีเมล</th>
              <th className="px-4 py-3">แผนก</th>
              <th className="px-4 py-3">บทบาท (Role)</th>
              <th className="px-4 py-3">สถานะ</th>
              <th className="px-4 py-3">เข้าสู่ระบบล่าสุด</th>
              <th className="px-4 py-3 text-right">จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">ไม่พบผู้ใช้ที่ตรงกับเงื่อนไข</td></tr>
            ) : rows.map((u) => (
              <tr key={u.email} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{u.full_name ?? u.username}</p>
                  {u.employee_code && <p className="text-xs text-gray-500">{u.employee_code}</p>}
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-900">{u.username}</p>
                  <p className="text-xs text-gray-500">{u.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-700">{u.department ?? "-"}</td>
                <td className="px-4 py-3"><RoleBadge role={u.role} /></td>
                <td className="px-4 py-3"><StatusBadge disabled={!u.is_active} /></td>
                <td className="px-4 py-3 text-gray-600">{u.last_sign_in_at ? dateFmt.format(u.last_sign_in_at) : "ยังไม่เคยเข้าสู่ระบบ"}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/settings/users/edit?email=${encodeURIComponent(u.email)}`}
                      className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
                    >
                      แก้ไข
                    </Link>
                    <form action={toggleUserActive}>
                      <input type="hidden" name="email" value={u.email} />
                      <input type="hidden" name="active" value={String(!u.is_active)} />
                      <button type="submit" className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100">
                        {u.is_active ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                      </button>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="flex flex-col gap-3 border-t border-gray-100 px-4 py-3 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <p>แสดง {from} - {Math.min(page * size, filtered.length)} จาก {filtered.length} รายการ</p>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              แสดงต่อหน้า
              {SIZES.map((s) => (
                <Link key={s} href={hrefFor({ size: String(s), page: "1" })}
                  className={`rounded px-2 py-0.5 ${s === size ? "bg-[#102E5A] text-white" : "hover:bg-gray-100"}`}>{s}</Link>
              ))}
            </span>
            <span className="flex items-center gap-1">
              {page > 1 ? <Link href={hrefFor({ page: String(page - 1) })} className="rounded px-2 py-0.5 hover:bg-gray-100">‹</Link> : <span className="px-2 text-gray-300">‹</span>}
              <span>{page} / {pages}</span>
              {page < pages ? <Link href={hrefFor({ page: String(page + 1) })} className="rounded px-2 py-0.5 hover:bg-gray-100">›</Link> : <span className="px-2 text-gray-300">›</span>}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

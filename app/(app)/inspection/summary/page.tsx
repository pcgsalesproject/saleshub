import Link from "next/link";
import sql from "@/lib/db";
import { getInspectionRows, badgeFor, type InspectionBadge } from "@/lib/inspection";
import FilterBar from "./FilterBar";

interface Department {
  id: number;
  name: string;
}

const MONTH_NAMES_TH = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

function getMonthOptions(count = 12): { value: string; label: string }[] {
  const now = new Date();
  const options = [];
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    options.push({ value, label: `${MONTH_NAMES_TH[d.getMonth()]} ${d.getFullYear() + 543}` });
  }
  return options;
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function formatDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

const BADGE_META: Record<InspectionBadge, { label: string; cls: string; action: string }> = {
  ok: { label: "✅ ตรวจแล้ว", cls: "bg-green-50 text-green-700 border-green-200", action: "ดู" },
  problem: { label: "🔴 พบปัญหา", cls: "bg-red-50 text-red-700 border-red-200", action: "ดู" },
  partial: { label: "🟡 ตรวจบางส่วน", cls: "bg-yellow-50 text-yellow-700 border-yellow-200", action: "ทำต่อ" },
  none: { label: "⬜ ยังไม่ตรวจ", cls: "bg-gray-50 text-gray-500 border-gray-200", action: "ตรวจเลย" },
};

async function getDepartments(): Promise<Department[]> {
  return sql<Department[]>`SELECT id, name FROM departments ORDER BY name`;
}

export default async function InspectionSummaryPage(props: PageProps<"/inspection/summary">) {
  const { department_id = "", month = "" } = await props.searchParams ?? {};
  const departmentId = String(department_id);
  const months = getMonthOptions();
  const selectedMonth = String(month) || months[0].value;

  const [departments, rows] = await Promise.all([
    getDepartments(),
    getInspectionRows(departmentId ? Number(departmentId) : null, selectedMonth),
  ]);

  const totalEmployees = rows.length;
  const checkedCount = rows.filter((r) => badgeFor(r) === "ok").length;
  const notCheckedCount = rows.filter((r) => badgeFor(r) === "none").length;
  const damagedAssets = rows.reduce((sum, r) => sum + r.damaged_count, 0);
  const pct = (n: number) => (totalEmployees === 0 ? 0 : Math.round((n / totalEmployees) * 100));

  const deptGroups = new Map<string, { total: number; completed: number }>();
  for (const r of rows) {
    const key = r.department_name ?? "ไม่ระบุฝ่าย";
    const g = deptGroups.get(key) ?? { total: 0, completed: 0 };
    g.total += 1;
    if (badgeFor(r) === "ok" || badgeFor(r) === "problem") g.completed += 1;
    deptGroups.set(key, g);
  }

  return (
    <div className="flex flex-col gap-4">

      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-800">สรุปผลการตรวจสอบทรัพย์สิน</span>
        <div className="flex items-center gap-2">
          <a
            href={`/inspection/summary/export?department_id=${departmentId}&month=${selectedMonth}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3.5 py-2 bg-white hover:bg-gray-50 transition-colors"
          >
            Export
          </a>
          <Link href="/inspection/new" className="btn-primary">
            ตรวจสอบใหม่
          </Link>
        </div>
      </div>

      <FilterBar departments={departments} months={months} departmentId={departmentId} month={selectedMonth} />

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">พนักงานทั้งหมด</p>
          <p className="text-2xl font-semibold text-gray-800">{totalEmployees}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">ตรวจแล้ว</p>
          <p className="text-2xl font-semibold text-green-600">{checkedCount} <span className="text-sm text-gray-400 font-normal">({pct(checkedCount)}%)</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">ยังไม่ตรวจ</p>
          <p className="text-2xl font-semibold text-gray-500">{notCheckedCount} <span className="text-sm text-gray-400 font-normal">({pct(notCheckedCount)}%)</span></p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">พบปัญหา</p>
          <p className="text-2xl font-semibold text-red-600">{damagedAssets} <span className="text-sm text-gray-400 font-normal">ชิ้น</span></p>
        </div>
      </div>

      {/* Department progress */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          ความคืบหน้าแยกฝ่าย
        </h2>
        {deptGroups.size === 0 ? (
          <p className="text-sm text-gray-400 py-2">ไม่มีข้อมูล</p>
        ) : (
          <div className="space-y-3">
            {[...deptGroups.entries()].map(([name, g]) => {
              const percent = g.total === 0 ? 0 : Math.round((g.completed / g.total) * 100);
              return (
                <div key={name} className="flex items-center gap-4">
                  <span className="text-sm text-gray-700 w-40 flex-shrink-0 truncate">{name}</span>
                  <div className="flex-1 h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#102E5A] rounded-full" style={{ width: `${percent}%` }} />
                  </div>
                  <span className="text-xs text-gray-500 w-12 text-right">{percent}%</span>
                  <span className="text-xs text-gray-400 w-20 text-right">{g.completed}/{g.total} คน</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Employee table */}
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
                    <td className="py-3 pr-4 text-gray-600">{formatDate(r.last_checked_at)}</td>
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

    </div>
  );
}

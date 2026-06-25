import Link from "next/link";
import sql from "@/lib/db";
import { getInspectionRows, badgeFor } from "@/lib/inspection";
import { listRounds } from "@/lib/actions/rounds";
import FilterBar from "./FilterBar";

interface Department {
  id: number;
  name: string;
}

async function getDepartments(): Promise<Department[]> {
  return sql<Department[]>`SELECT id, name FROM departments ORDER BY name`;
}

export default async function InspectionSummaryPage(props: PageProps<"/inspection/summary">) {
  const { department_id = "", round_id = "" } = await props.searchParams ?? {};
  const departmentId = String(department_id);

  const rounds = await listRounds();
  const openRound = rounds.find((r) => r.status === "open");
  const selectedRoundId = String(round_id) || String(openRound?.id ?? rounds[0]?.id ?? "");

  const rows = await getInspectionRows(
    departmentId ? Number(departmentId) : null,
    selectedRoundId ? Number(selectedRoundId) : null
  );
  const departments = await getDepartments();

  const totalEmployees = rows.length;
  const checkedCount = rows.filter((r) => badgeFor(r) === "ok" || badgeFor(r) === "problem").length;
  const notCheckedCount = rows.filter((r) => badgeFor(r) === "none").length;
  const damagedAssets = rows.reduce((sum, r) => sum + Number(r.damaged_count), 0);
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
          <Link
            href="/inspection/rounds"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3.5 py-2 bg-white hover:bg-gray-50 transition-colors"
          >
            จัดการรอบการตรวจสอบ
          </Link>
          <a
            href={`/inspection/summary/export?department_id=${departmentId}&round_id=${selectedRoundId}`}
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3.5 py-2 bg-white hover:bg-gray-50 transition-colors"
          >
            Export
          </a>
          <Link href="/inspection/new" className="btn-primary">
            ตรวจสอบใหม่
          </Link>
        </div>
      </div>

      <FilterBar departments={departments} rounds={rounds} departmentId={departmentId} roundId={selectedRoundId} />

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

    </div>
  );
}

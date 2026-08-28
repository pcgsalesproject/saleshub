import Link from "next/link";
import Header from "@/components/Header";
import sql from "@/lib/db";

export const dynamic = "force-dynamic";

interface DashboardStats {
  employees: number;
  active_employees: number;
  assets: number;
  assigned_assets: number;
  repair_assets: number;
  expiring_soon: number;
  open_rounds: number;
}

interface RecentAssignment {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  employee_id: number;
  employee_name: string;
  assigned_at: string | null;
}

async function getDashboardData() {
  const [[stats], recentAssignments] = await Promise.all([
    sql<DashboardStats[]>`
      SELECT
        (SELECT COUNT(*) FROM employees)::int AS employees,
        (SELECT COUNT(*) FROM employees WHERE is_active)::int AS active_employees,
        (SELECT COUNT(*) FROM assets)::int AS assets,
        (SELECT COUNT(DISTINCT asset_id) FROM asset_assignments WHERE returned_at IS NULL)::int AS assigned_assets,
        (SELECT COUNT(*) FROM assets WHERE status = 'repair')::int AS repair_assets,
        (SELECT COUNT(*) FROM assets WHERE warranty_expiry IS NOT NULL AND warranty_expiry >= CURRENT_DATE AND warranty_expiry <= CURRENT_DATE + INTERVAL '30 days')::int AS expiring_soon,
        (SELECT COUNT(*) FROM inspection_rounds WHERE status = 'open')::int AS open_rounds
    `,
    sql<RecentAssignment[]>`
      SELECT
        aa.id,
        a.id AS asset_id,
        a.asset_tag,
        a.asset_name,
        e.id AS employee_id,
        TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS employee_name,
        aa.assigned_at
      FROM asset_assignments aa
      JOIN assets a ON a.id = aa.asset_id
      JOIN employees e ON e.id = aa.employee_id
      ORDER BY aa.assigned_at DESC NULLS LAST, aa.id DESC
      LIMIT 5
    `,
  ]);

  return { stats, recentAssignments };
}

function formatDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function StatCard({ label, value, sub }: { label: string; value: number; sub: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-gray-900">{value.toLocaleString()}</p>
      <p className="mt-1 text-xs text-gray-400">{sub}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const { stats, recentAssignments } = await getDashboardData();
  const availableAssets = Math.max(stats.assets - stats.assigned_assets - stats.repair_assets, 0);

  return (
    <div>
      <Header title="Dashboard" subtitle="ภาพรวมพนักงานและทรัพย์สิน" />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="พนักงานทั้งหมด" value={stats.employees} sub={`${stats.active_employees.toLocaleString()} คนยังปฏิบัติงาน`} />
        <StatCard label="ทรัพย์สินทั้งหมด" value={stats.assets} sub={`${stats.assigned_assets.toLocaleString()} รายการถูกมอบหมายแล้ว`} />
        <StatCard label="พร้อมมอบหมาย" value={availableAssets} sub="ไม่นับรายการซ่อมและรายการที่ใช้งานอยู่" />
        <StatCard label="ใกล้หมดประกัน" value={stats.expiring_soon} sub="ภายใน 30 วัน" />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-[2fr_1fr]">
        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold text-gray-900">การมอบหมายล่าสุด</h2>
            <Link href="/assignments" className="text-sm font-medium text-[#102E5A] hover:underline">ดูทั้งหมด</Link>
          </div>
          {recentAssignments.length === 0 ? (
            <p className="py-8 text-center text-sm text-gray-400">ยังไม่มีประวัติการมอบหมาย</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs font-semibold text-gray-500">
                    <th className="py-2 pr-4">วันที่</th>
                    <th className="py-2 pr-4">ทรัพย์สิน</th>
                    <th className="py-2 pr-4">ผู้รับ</th>
                  </tr>
                </thead>
                <tbody>
                  {recentAssignments.map((item) => (
                    <tr key={item.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 text-gray-500">{formatDate(item.assigned_at)}</td>
                      <td className="py-3 pr-4">
                        <Link href={`/assets/${item.asset_id}`} className="font-medium text-gray-900 hover:text-[#102E5A] hover:underline">
                          {item.asset_name}
                        </Link>
                        <div className="font-mono text-xs text-gray-400">{item.asset_tag}</div>
                      </td>
                      <td className="py-3 pr-4">
                        <Link href={`/employees/${item.employee_id}?tab=assignments`} className="text-gray-700 hover:text-[#102E5A] hover:underline">
                          {item.employee_name}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="text-base font-semibold text-gray-900">สถานะที่ควรติดตาม</h2>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between rounded-lg bg-orange-50 px-3 py-2 text-orange-700">
              <span>ทรัพย์สินอยู่ระหว่างซ่อม</span>
              <span className="font-semibold">{stats.repair_assets.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-blue-50 px-3 py-2 text-blue-700">
              <span>รอบตรวจทรัพย์สินที่เปิดอยู่</span>
              <span className="font-semibold">{stats.open_rounds.toLocaleString()}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

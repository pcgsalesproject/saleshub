import sql from "@/lib/db";
import s from "./EmployeeStats.module.css";
import { DepartmentDonut, AgeBarChart, TenureHBarChart } from "./EmployeeCharts";

interface Totals {
  total: number;
  new_this_month: number;
  resigned_this_month: number;
  avg_age: number | null;
  avg_tenure: number | null;
  male: number;
  female: number;
}

interface DeptRow {
  name: string;
  count: number;
}

const AGE_BUCKETS = [
  { label: "≤ 20", min: 0, max: 20 },
  { label: "21-30", min: 21, max: 30 },
  { label: "31-40", min: 31, max: 40 },
  { label: "41-50", min: 41, max: 50 },
  { label: "51-60", min: 51, max: 60 },
  { label: "> 60", min: 61, max: 999 },
];

const TENURE_BUCKETS = [
  { label: "น้อยกว่า 1 ปี", min: 0, max: 1 },
  { label: "1 - 3 ปี", min: 1, max: 3 },
  { label: "3 - 5 ปี", min: 3, max: 5 },
  { label: "5 - 10 ปี", min: 5, max: 10 },
  { label: "มากกว่า 10 ปี", min: 10, max: 999 },
];

async function getTotals(): Promise<Totals> {
  const [row] = await sql<Totals[]>`
    SELECT
      (SELECT COUNT(*) FROM employees WHERE is_active)::int AS total,
      (SELECT COUNT(*) FROM employees WHERE start_date >= date_trunc('month', CURRENT_DATE))::int AS new_this_month,
      (SELECT COUNT(*) FROM employees WHERE resigned_at >= date_trunc('month', CURRENT_DATE))::int AS resigned_this_month,
      (SELECT AVG(EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth))) FROM employees WHERE is_active AND date_of_birth IS NOT NULL) AS avg_age,
      (SELECT AVG(EXTRACT(YEAR FROM age(CURRENT_DATE, start_date))) FROM employees WHERE is_active AND start_date IS NOT NULL) AS avg_tenure,
      (SELECT COUNT(*) FROM employees WHERE is_active AND gender = 'male')::int AS male,
      (SELECT COUNT(*) FROM employees WHERE is_active AND gender = 'female')::int AS female
  `;
  return row;
}

async function getDepartmentBreakdown(): Promise<DeptRow[]> {
  return sql<DeptRow[]>`
    SELECT COALESCE(d.name, 'ไม่ระบุ') AS name, COUNT(*)::int AS count
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.is_active
    GROUP BY d.name
    ORDER BY count DESC
  `;
}

async function getAges(): Promise<number[]> {
  const rows = await sql<{ age: number }[]>`
    SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth))::int AS age
    FROM employees WHERE is_active AND date_of_birth IS NOT NULL
  `;
  return rows.map((r) => r.age);
}

async function getTenures(): Promise<number[]> {
  const rows = await sql<{ tenure: number }[]>`
    SELECT EXTRACT(YEAR FROM age(CURRENT_DATE, start_date))::numeric AS tenure
    FROM employees WHERE is_active AND start_date IS NOT NULL
  `;
  return rows.map((r) => Number(r.tenure));
}

function KpiCard({
  title,
  value,
  sub,
  iconColor,
  icon,
}: {
  title: string;
  value: string;
  sub: string;
  iconColor: "blue" | "green" | "orange" | "red" | "purple" | "cyan";
  icon: React.ReactNode;
}) {
  const iconClass = {
    blue: s.kpiIconBlue,
    green: s.kpiIconGreen,
    orange: s.kpiIconOrange,
    red: s.kpiIconRed,
    purple: s.kpiIconPurple,
    cyan: s.kpiIconCyan,
  }[iconColor];

  return (
    <div className={s.kpiCard}>
      <div className={s.kpiTop}>
        <span className={s.kpiTitle}>{title}</span>
        <div className={`${s.kpiIcon} ${iconClass}`}>{icon}</div>
      </div>
      <p className={s.kpiValue}>{value}</p>
      <p className={s.kpiSub}>{sub}</p>
    </div>
  );
}


export default async function EmployeeStats() {
  const [totals, departments, ages, tenures] = await Promise.all([
    getTotals(),
    getDepartmentBreakdown(),
    getAges(),
    getTenures(),
  ]);

  const genderTotal = totals.male + totals.female;
  const malePct = genderTotal > 0 ? Math.round((totals.male / genderTotal) * 100) : 0;
  const femalePct = genderTotal > 0 ? 100 - malePct : 0;

  const ageBuckets = AGE_BUCKETS.map((b) => ({
    label: b.label,
    count: ages.filter((a) => a >= b.min && a <= b.max).length,
  }));

  const tenureTotal = tenures.length || 1;
  const tenureBuckets = TENURE_BUCKETS.map((b) => {
    const count = tenures.filter((t) => t >= b.min && (b.max === 999 ? true : t < b.max)).length;
    return { label: b.label, count, pct: (count / tenureTotal) * 100 };
  });

  return (
    <div className="mb-6 space-y-4">
      <div className={s.kpiGrid}>
        <KpiCard
          title="พนักงานทั้งหมด"
          value={totals.total.toLocaleString()}
          sub="คน"
          iconColor="blue"
          icon={
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          }
        />
        <KpiCard
          title="พนักงานใหม่"
          value={totals.new_this_month.toLocaleString()}
          sub="เดือนนี้"
          iconColor="purple"
          icon={
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
            </svg>
          }
        />
        <KpiCard
          title="พนักงานลาออก"
          value={totals.resigned_this_month.toLocaleString()}
          sub="เดือนนี้"
          iconColor="red"
          icon={
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          }
        />
        <KpiCard
          title="อายุเฉลี่ย"
          value={totals.avg_age != null ? Number(totals.avg_age).toFixed(1) : "—"}
          sub="ปี ช่วงอายุ 20 - 58 ปี"
          iconColor="cyan"
          icon={
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.964 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
        />
        <KpiCard
          title="อายุงานเฉลี่ย"
          value={totals.avg_tenure != null ? Number(totals.avg_tenure).toFixed(1) : "—"}
          sub="ปี ช่วงอายุงาน 0 - 20 ปี"
          iconColor="purple"
          icon={
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <div className={s.kpiCard}>
          <div className={s.kpiTop}>
            <span className={s.kpiTitle}>สัดส่วนเพศ</span>
            <div className={`${s.kpiIcon} ${s.kpiIconBlue}`}>
              <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm0 0V3m0 3h3m-3 0H7.5M19.5 6l-3.879 3.879m0 0a3 3 0 10-4.242 4.242 3 3 0 004.242-4.242zm0 0V3m0 3h-3" />
              </svg>
            </div>
          </div>
          <div className={s.genderRow}>
            <span className="text-sm font-semibold text-gray-900">ชาย {malePct}%</span>
            <div className={s.genderBar}>
              <div className={s.genderBarFill} style={{ width: `${malePct}%` }} />
            </div>
            <span className="text-sm font-semibold text-gray-900">หญิง {femalePct}%</span>
          </div>
        </div>
      </div>

      <div className={s.panelGrid}>
        <div className={`${s.panel} ${s.panelTall}`}>
          <p className={s.panelTitle}>พนักงานตามแผนก</p>
          <DepartmentDonut data={departments} />
          <div className={s.panelFooter}>
            <button type="button" className={s.detailBtn}>ดูรายละเอียด</button>
          </div>
        </div>

        <div className={s.panel}>
          <p className={s.panelTitle}>ช่วงอายุพนักงาน (คน)</p>
          <AgeBarChart data={ageBuckets} />
          <div className={s.panelFooter}>
            <button type="button" className={s.detailBtn}>ดูรายละเอียด</button>
          </div>
        </div>

        <div className={s.panel}>
          <p className={s.panelTitle}>อายุงานของพนักงาน</p>
          <TenureHBarChart data={tenureBuckets} />
          <div className={s.panelFooter}>
            <button type="button" className={s.detailBtn}>ดูรายละเอียด</button>
          </div>
        </div>

      </div>
    </div>
  );
}

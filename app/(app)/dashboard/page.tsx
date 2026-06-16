import Header from "@/components/Header";
import sql from "@/lib/db";
import s from "./page.module.css";

interface AssetStats {
  total: number;
  assigned: number;
  expiring_soon: number;
}

async function getStats(): Promise<AssetStats> {
  const [row] = await sql<AssetStats[]>`
    SELECT
      (SELECT COUNT(*) FROM assets)::int AS total,
      (SELECT COUNT(DISTINCT asset_id) FROM asset_assignments WHERE returned_at IS NULL)::int AS assigned,
      (SELECT COUNT(*) FROM assets WHERE warranty_expiry IS NOT NULL AND warranty_expiry >= CURRENT_DATE AND warranty_expiry <= CURRENT_DATE + INTERVAL '30 days')::int AS expiring_soon
  `;
  return row;
}

function KpiCard({
  title,
  value,
  sub,
  iconColor,
  icon,
}: {
  title: string;
  value: number;
  sub: string;
  iconColor: "blue" | "green" | "orange" | "red" | "purple";
  icon: React.ReactNode;
}) {
  const iconClass = {
    blue: s.kpiIconBlue,
    green: s.kpiIconGreen,
    orange: s.kpiIconOrange,
    red: s.kpiIconRed,
    purple: s.kpiIconPurple,
  }[iconColor];

  return (
    <div className={s.kpiCard}>
      <div className={s.kpiTop}>
        <span className={s.kpiTitle}>{title}</span>
        <div className={`${s.kpiIcon} ${iconClass}`}>{icon}</div>
      </div>
      <p className={s.kpiValue}>{value.toLocaleString()}</p>
      <p className={s.kpiSub}>{sub}</p>
    </div>
  );
}

export default async function DashboardPage() {
  const stats = await getStats();
  const available = Math.max(stats.total - stats.assigned, 0);

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Overview of assets and employees"
      />
      <div className={s.kpiGrid}>
        <KpiCard
          title="Total Assets"
          value={stats.total}
          sub="All registered assets"
          iconColor="blue"
          icon={
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
          }
        />
        <KpiCard
          title="Assigned"
          value={stats.assigned}
          sub="Currently assigned"
          iconColor="blue"
          icon={
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
          }
        />
        <KpiCard
          title="Available"
          value={available}
          sub="Ready to assign"
          iconColor="green"
          icon={
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <KpiCard
          title="Expiring Soon (30 Days)"
          value={stats.expiring_soon}
          sub="Warranty expires soon"
          iconColor="orange"
          icon={
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-12 text-center text-gray-400">
        Dashboard KPIs — coming soon
      </div>
    </div>
  );
}
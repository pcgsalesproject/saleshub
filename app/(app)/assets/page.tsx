import Link from "next/link";
import Header from "@/components/Header";
import sql from "@/lib/db";
import type { Asset, AssetType } from "@/lib/types";
import AssetFilters from "./AssetFilters";
import DeleteAssetButton from "./DeleteAssetButton";
import ExpiringSoonCard from "./ExpiringSoonCard";
import s from "./page.module.css";

const PAGE_SIZE = 10;

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

export interface ExpiringAsset {
  id: number;
  asset_tag: string;
  asset_name: string;
  asset_type_name: string | null;
  warranty_expiry: string;
  employee_name: string | null;
}

async function getExpiringAssets(): Promise<ExpiringAsset[]> {
  return sql<ExpiringAsset[]>`
    SELECT a.id, a.asset_tag, a.asset_name, at.name AS asset_type_name, a.warranty_expiry,
      TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS employee_name
    FROM assets a
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    LEFT JOIN asset_assignments aa ON aa.asset_id = a.id AND aa.returned_at IS NULL
    LEFT JOIN employees e ON e.id = aa.employee_id
    WHERE a.warranty_expiry IS NOT NULL
      AND a.warranty_expiry >= CURRENT_DATE
      AND a.warranty_expiry <= CURRENT_DATE + INTERVAL '30 days'
    ORDER BY a.warranty_expiry ASC
  `;
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

function formatDate(v?: string | Date | null) {
  if (!v) return undefined;
  const d = new Date(v);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

interface AssetRow extends Asset {
  computed_status: "assigned" | "available" | "repair";
}

interface Filters {
  search: string;
  type: string;
  status: string;
  page: number;
}

async function getAssetTypes(): Promise<AssetType[]> {
  return sql<AssetType[]>`SELECT id, code, name FROM asset_types ORDER BY name`;
}

async function getAssets(filters: Filters): Promise<{ rows: AssetRow[]; total: number }> {
  const { search, type, status, page } = filters;
  const like = `%${search}%`;

  const searchCond = search
    ? sql`AND (a.asset_tag ILIKE ${like} OR a.asset_code ILIKE ${like} OR a.asset_name ILIKE ${like} OR a.serial_number ILIKE ${like} OR a.phone_number ILIKE ${like})`
    : sql``;

  const typeCond = type ? sql`AND a.asset_type_id = ${Number(type)}` : sql``;

  const statusCond = status
    ? sql`AND base.computed_status = ${status}`
    : sql``;

  const offset = (page - 1) * PAGE_SIZE;

  const rows = await sql<AssetRow[]>`
    SELECT * FROM (
      SELECT a.*, at.name AS asset_type_name,
        CASE
          WHEN cur.employee_id IS NOT NULL THEN 'assigned'
          WHEN a.status = 'repair' THEN 'repair'
          ELSE 'available'
        END AS computed_status
      FROM assets a
      LEFT JOIN asset_types at ON a.asset_type_id = at.id
      LEFT JOIN LATERAL (
        SELECT aa.employee_id FROM asset_assignments aa
        WHERE aa.asset_id = a.id AND aa.returned_at IS NULL
        ORDER BY aa.assigned_at DESC LIMIT 1
      ) cur ON true
      WHERE 1=1 ${searchCond} ${typeCond}
    ) base
    WHERE 1=1 ${statusCond}
    ORDER BY base.asset_code
    LIMIT ${PAGE_SIZE} OFFSET ${offset}
  `;

  const [{ count }] = await sql<{ count: number }[]>`
    SELECT COUNT(*)::int AS count FROM (
      SELECT a.id,
        CASE
          WHEN cur.employee_id IS NOT NULL THEN 'assigned'
          WHEN a.status = 'repair' THEN 'repair'
          ELSE 'available'
        END AS computed_status
      FROM assets a
      LEFT JOIN LATERAL (
        SELECT aa.employee_id FROM asset_assignments aa
        WHERE aa.asset_id = a.id AND aa.returned_at IS NULL
        ORDER BY aa.assigned_at DESC LIMIT 1
      ) cur ON true
      WHERE 1=1 ${searchCond} ${typeCond}
    ) base
    WHERE 1=1 ${statusCond}
  `;

  return { rows, total: count };
}

function StatusBadge({ status }: { status: AssetRow["computed_status"] }) {
  const map = {
    assigned: { cls: s.statusAssigned, label: "Assigned" },
    available: { cls: s.statusAvailable, label: "Available" },
    repair: { cls: s.statusRepair, label: "In Repair" },
  } as const;
  const { cls, label } = map[status];
  return (
    <span className={`${s.statusBadge} ${cls}`}>
      <span className={s.statusDot} />
      {label}
    </span>
  );
}

function buildPageHref(filters: Filters, page: number) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.type) params.set("type", filters.type);
  if (filters.status) params.set("status", filters.status);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/assets${qs ? `?${qs}` : ""}`;
}

function Pagination({ filters, total }: { filters: Filters; total: number }) {
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);
  const page = Math.min(filters.page, totalPages);
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);

  const middle = new Set<number>();
  for (let p = Math.max(1, page - 1); p <= Math.min(totalPages, page + 1); p++) middle.add(p);
  middle.add(1);
  middle.add(totalPages);
  const pages = [...middle].sort((a, b) => a - b);

  return (
    <div className={s.pagination}>
      <span>Showing {from} to {to} of {total.toLocaleString()} entries</span>
      <div className={s.pageBtns}>
        <Link
          href={buildPageHref(filters, page - 1)}
          className={`${s.pageBtn} ${page <= 1 ? s.pageBtnDisabled : ""}`}
        >
          ‹
        </Link>
        {pages.map((p, i) => (
          <span key={p} style={{ display: "contents" }}>
            {i > 0 && p - pages[i - 1] > 1 && <span className={s.pageEllipsis}>…</span>}
            <Link
              href={buildPageHref(filters, p)}
              className={`${s.pageBtn} ${p === page ? s.pageBtnActive : ""}`}
            >
              {p}
            </Link>
          </span>
        ))}
        <Link
          href={buildPageHref(filters, page + 1)}
          className={`${s.pageBtn} ${page >= totalPages ? s.pageBtnDisabled : ""}`}
        >
          ›
        </Link>
      </div>
    </div>
  );
}

export default async function AssetsPage(props: PageProps<"/assets">) {
  const {
    search = "",
    type = "",
    status = "",
    page = "1",
  } = await props.searchParams ?? {};

  const filters: Filters = {
    search: String(search),
    type: String(type),
    status: String(status),
    page: Math.max(Number(page) || 1, 1),
  };

  const [assetTypes, stats, { rows, total }, expiringAssets] = await Promise.all([
    getAssetTypes(),
    getStats(),
    getAssets(filters),
    getExpiringAssets(),
  ]);
  const available = Math.max(stats.total - stats.assigned, 0);

  return (
    <div>
      <Header
        title="Assets"
        subtitle="IT Asset Management"
        actions={
          <>
            <Link
              href="/assets/import"
              className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3.5 py-2 bg-white hover:bg-gray-50 transition-colors"
            >
              นำเข้าทรัพย์สิน
            </Link>
            <Link href="/assets/new" className="btn-primary">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              เพิ่มทรัพย์สิน
            </Link>
          </>
        }
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
        <ExpiringSoonCard value={stats.expiring_soon} assets={expiringAssets} />
      </div>

      <AssetFilters
        assetTypes={assetTypes}
        defaultSearch={filters.search}
        defaultType={filters.type}
        defaultStatus={filters.status}
      />

      <div className={s.tableWrap}>
        {rows.length === 0 ? (
          <p className={s.empty}>ไม่พบข้อมูลทรัพย์สิน</p>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th>Asset Tag</th>
                <th>Asset Name</th>
                <th>Type</th>
                <th>Serial Number</th>
                <th>Expired Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((asset) => (
                <tr key={asset.id}>
                  <td>
                    <Link href={`/assets/${asset.id}`} className={s.assetCodeLink}>{asset.asset_tag}</Link>
                  </td>
                  <td>{asset.asset_name}</td>
                  <td>{asset.asset_type_name ?? "—"}</td>
                  <td>{asset.serial_number ?? "—"}</td>
                  <td>{formatDate(asset.warranty_expiry) ?? "—"}</td>
                  <td><StatusBadge status={asset.computed_status} /></td>
                  <td>
                    <div className={s.actions}>
                      <Link href={`/assets/${asset.id}`} className={s.actionBtn} title="View">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </Link>
                      <Link href={`/assets/${asset.id}/edit`} className={s.actionBtn} title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                        </svg>
                      </Link>
                      <button type="button" className={s.actionBtn} title="Transfer">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                        </svg>
                      </button>
                      <DeleteAssetButton assetId={asset.id} assetName={asset.asset_name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <Pagination filters={filters} total={total} />
      </div>
    </div>
  );
}
import Link from "next/link";
import Header from "@/components/Header";
import sql from "@/lib/db";
import type { Asset, AssetType } from "@/lib/types";
import AssetFilters from "./AssetFilters";
import s from "./page.module.css";

const PAGE_SIZE = 10;

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
    ? sql`AND (a.asset_tag ILIKE ${like} OR a.asset_code ILIKE ${like} OR a.asset_name ILIKE ${like} OR a.serial_number ILIKE ${like})`
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

  const [assetTypes, { rows, total }] = await Promise.all([
    getAssetTypes(),
    getAssets(filters),
  ]);

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
                    <span className={s.assetCodeLink}>{asset.asset_tag}</span>
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
                      <button type="button" className={`${s.actionBtn} ${s.actionDelete}`} title="Delete">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                      </button>
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
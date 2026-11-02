import Link from "next/link";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import type { Asset } from "@/lib/types";
import { returnAsset } from "@/lib/actions/assets";
import ReturnAssetForm from "@/components/ReturnAssetForm";

interface AssignmentRow {
  id: number;
  employee_id: number;
  employee_id_str: string;
  employee_name: string;
  department_name: string | null;
  position_name: string | null;
  assigned_at: string | null;
  returned_at: string | null;
  note: string | null;
}

interface AssetDetail extends Asset {
  asset_type_name: string | null;
}

async function getAsset(id: number): Promise<AssetDetail | null> {
  const rows = await sql<AssetDetail[]>`
    SELECT a.*, at.name AS asset_type_name
    FROM assets a
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    WHERE a.id = ${id}
  `;
  return rows[0] ?? null;
}

async function getHistory(assetId: number): Promise<AssignmentRow[]> {
  return sql<AssignmentRow[]>`
    SELECT
      aa.id,
      e.id AS employee_id,
      e.employee_id AS employee_id_str,
      TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS employee_name,
      d.name AS department_name,
      p.position AS position_name,
      aa.assigned_at,
      aa.returned_at,
      aa.note
    FROM asset_assignments aa
    JOIN employees e ON aa.employee_id = e.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    WHERE aa.asset_id = ${assetId}
    ORDER BY aa.assigned_at DESC
  `;
}

function formatDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

function formatPrice(v?: number | null) {
  if (v == null) return "—";
  return Number(v).toLocaleString("en-US", { minimumFractionDigits: 2 });
}

const DAY_MS = 24 * 60 * 60 * 1000;

function warrantyProgress(purchase?: string | null, expiry?: string | null) {
  if (!purchase || !expiry) return null;
  const start = new Date(purchase).getTime();
  const end = new Date(expiry).getTime();
  if (!(end > start)) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysLeft = Math.ceil((end - today.getTime()) / DAY_MS);
  const pctLeft = Math.min(Math.max(((end - today.getTime()) / (end - start)) * 100, 0), 100);
  return { daysLeft, pctLeft };
}

const SHIELD = "M20.618 5.984A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z";

const ICONS = {
  tag: "M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z",
  device: "M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z",
  layers: "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  cube: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  barcode: "M4 6v12M8 6v12M11 6v12M15 6v12M18 6v12M21 6v12",
  chip: "M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z",
  phone: "M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z",
  activity: "M3 12h4l3-9 4 18 3-9h4",
  cart: "M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z",
  doc: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  store: "M4 21V11m16 10V11M3 3h18l1 6a3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 01-3 3 3 3 0 01-3-3 3 3 0 01-3 3 3 3 0 01-3-3l1-6z",
  calendar: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  shield: `M9 12l2 2 4-4M${SHIELD.slice(1)}`,
} as const;

type IconName = keyof typeof ICONS;

function Icon({ name, className = "w-[18px] h-[18px]" }: { name: IconName; className?: string }) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.6} viewBox="0 0 24 24" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[name]} />
    </svg>
  );
}

function Field({
  label,
  value,
  icon,
  dense,
}: {
  label: string;
  value?: string | null;
  icon?: IconName;
  dense?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between gap-4 ${dense ? "py-2" : "py-3.5"} border-b border-gray-100 last:border-0`}>
      <span className="flex items-center gap-3 text-sm text-gray-500 whitespace-nowrap">
        {icon && <Icon name={icon} className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />}
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-800 text-right break-words">{value || "—"}</span>
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-base font-semibold text-gray-800 pb-3 mb-1 border-b border-gray-100">
      <span className="w-2.5 h-2.5 rounded-full bg-orange-400 flex-shrink-0" />
      {children}
    </h2>
  );
}

function StatusBadge({ assigned, status }: { assigned: boolean; status: string | null }) {
  const [text, dot, cls] = assigned
    ? ["Assigned", "bg-blue-500", "text-blue-700 bg-blue-50 border-blue-100"]
    : status === "repair"
      ? ["In Repair", "bg-orange-500", "text-orange-700 bg-orange-50 border-orange-100"]
      : status === "damaged"
        ? ["Damaged", "bg-red-500", "text-red-700 bg-red-50 border-red-100"]
        : status === "retired"
          ? ["Retired", "bg-gray-400", "text-gray-600 bg-gray-100 border-gray-200"]
          : ["Available", "bg-green-500", "text-green-700 bg-green-50 border-green-100"];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium border rounded-full px-2.5 py-1 ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {text}
    </span>
  );
}

export default async function AssetDetailPage(props: PageProps<"/assets/[id]">) {
  const { id } = await props.params;
  const numId = Number(id);

  const [asset, history] = await Promise.all([
    getAsset(numId),
    getHistory(numId),
  ]);

  if (!asset) notFound();

  const current = history.find((h) => !h.returned_at);
  const warranty = warrantyProgress(asset.purchase_date, asset.warranty_expiry);

  // One timeline entry per hand-over and per return, newest first.
  const events = history
    .flatMap((h) => [
      { key: `a${h.id}`, kind: "assign" as const, at: h.assigned_at, h },
      ...(h.returned_at ? [{ key: `r${h.id}`, kind: "return" as const, at: h.returned_at, h }] : []),
    ])
    .sort((x, y) => new Date(y.at ?? 0).getTime() - new Date(x.at ?? 0).getTime());

  return (
    <div className="@container flex flex-col gap-4">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Link href="/assets" className="text-gray-400 hover:text-gray-700">Assets</Link>
        <span className="text-gray-300">›</span>
        <span className="font-semibold text-gray-800">{asset.asset_tag}</span>
      </div>

      {/* Title + actions */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-[#102E5A]">{asset.asset_name}</h1>
            {asset.asset_type_name && (
              <span className="rounded-lg border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
                {asset.asset_type_name}
              </span>
            )}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-500">
            <StatusBadge assigned={!!current} status={asset.status} />
            <span>
              Asset Tag: <span className="font-semibold text-gray-800">{asset.asset_tag}</span>
            </span>
            {asset.eid && (
              <>
                <span className="text-gray-300">|</span>
                <span className="break-all">EID: {asset.eid}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/assets"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3.5 py-2 bg-white hover:bg-gray-50 transition-colors"
          >
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            กลับไปรายการ
          </Link>
          <Link href={`/assets/${asset.id}/assign`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#102E5A] border border-[#102E5A] rounded-lg px-3.5 py-2 hover:bg-[#eef2fa] transition-colors">
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            โอนผู้รับผิดชอบ
          </Link>
          <Link href={`/assets/check/${asset.asset_tag}`} className="inline-flex items-center gap-1.5 text-sm font-medium text-[#102E5A] border border-[#102E5A] rounded-lg px-3.5 py-2 hover:bg-[#eef2fa] transition-colors">
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            ตรวจสอบ
          </Link>
          <Link href={`/assets/${asset.id}/edit`} className="btn-primary">
            <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
            </svg>
            แก้ไข
          </Link>
        </div>
      </div>

      {/* Row 1: ข้อมูลทรัพย์สิน + ข้อมูลการจัดซื้อและรับประกัน */}
      <div className="grid gap-4 @4xl:grid-cols-[2fr_1fr]">
        <div className="@container bg-white border border-gray-200 rounded-xl p-6">
          <CardTitle>ข้อมูลทรัพย์สิน</CardTitle>
          <div className="grid @2xl:[grid-template-columns:5fr_4fr] @2xl:gap-x-8">
            <div>
              <Field icon="tag" label="Asset Tag" value={asset.asset_tag} />
              <Field icon="device" label="ชื่อทรัพย์สิน" value={asset.asset_name} />
              <Field icon="layers" label="ประเภท" value={asset.asset_type_name} />
              <Field icon="tag" label="ยี่ห้อ (Brand)" value={asset.brand} />
              <Field icon="cube" label="รุ่น (Model)" value={asset.model} />
            </div>
            <div className="@2xl:border-l @2xl:border-gray-100 @2xl:pl-8">
              <Field icon="barcode" label="Serial Number" value={asset.serial_number} />
              <Field icon="chip" label="EID" value={asset.eid} />
              <Field icon="phone" label="เบอร์โทรศัพท์ (ถ้ามี)" value={asset.phone_number} />
              <div className="flex items-center justify-between gap-4 py-3.5">
                <span className="flex items-center gap-3 text-sm text-gray-500">
                  <Icon name="activity" className="w-[18px] h-[18px] text-gray-400 flex-shrink-0" />
                  สถานะ
                </span>
                <StatusBadge assigned={!!current} status={asset.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <CardTitle>ข้อมูลการจัดซื้อและรับประกัน</CardTitle>
          <div>
            <Field dense icon="cart" label="ราคาซื้อ" value={asset.purchase_price != null ? `฿${formatPrice(asset.purchase_price)}` : null} />
            <Field dense icon="doc" label="เลขที่ใบสั่งซื้อ" value={asset.po_number} />
            <Field dense icon="store" label="ผู้จัดจำหน่าย" value={asset.vendor} />
            <Field dense icon="calendar" label="วันที่ซื้อ" value={formatDate(asset.purchase_date)} />
            <Field dense icon="shield" label="ระยะเวลารับประกัน" value={asset.warranty_conditions} />
            <Field dense icon="calendar" label="วันที่หมดประกัน" value={formatDate(asset.warranty_expiry)} />
          </div>
          {warranty && (
            <div
              className={`mt-1 mb-0 rounded-xl px-4 py-2 ${
                warranty.daysLeft < 0 ? "bg-red-50" : warranty.daysLeft <= 30 ? "bg-orange-50" : "bg-blue-50"
              }`}
            >
              <p
                className={`flex items-center gap-2 text-sm font-semibold mb-2 ${
                  warranty.daysLeft < 0 ? "text-red-600" : "text-[#102E5A]"
                }`}
              >
                <Icon name="shield" className="w-5 h-5 flex-shrink-0" />
                {warranty.daysLeft < 0
                  ? `หมดประกันแล้ว ${Math.abs(warranty.daysLeft).toLocaleString()} วัน`
                  : `เหลือประกันอีก ${warranty.daysLeft.toLocaleString()} วัน`}
              </p>
              <div className="h-2 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    warranty.daysLeft < 0 ? "bg-red-500" : warranty.daysLeft <= 30 ? "bg-orange-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${warranty.pctLeft}%` }}
                />
              </div>
              <div className="mt-1.5 flex justify-between text-xs text-gray-500">
                <span>{formatDate(asset.purchase_date)}</span>
                <span>{formatDate(asset.warranty_expiry)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ผู้ครอบครองปัจจุบัน */}
      {current && (
        <div className="@container bg-white border border-gray-200 rounded-xl p-6">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="flex items-center gap-3 text-base font-semibold text-[#102E5A]">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#102E5A] text-white">
                <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                </svg>
              </span>
              ผู้ครอบครองปัจจุบัน
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-green-700">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
              กำลังใช้งาน
            </span>
          </div>
          <div className="grid gap-4 grid-cols-2 @3xl:grid-cols-5 @3xl:divide-x @3xl:divide-gray-100">
            <div className="@3xl:pr-6">
              <p className="text-xs text-gray-400 mb-1">ชื่อ-นามสกุล</p>
              <Link href={`/employees/${current.employee_id}`} className="text-sm font-semibold text-gray-800 hover:text-[#102E5A] hover:underline">
                {current.employee_name}
              </Link>
            </div>
            <div className="@3xl:px-6">
              <p className="text-xs text-gray-400 mb-1">รหัสพนักงาน</p>
              <p className="text-sm font-semibold text-gray-800">{current.employee_id_str}</p>
            </div>
            <div className="@3xl:px-6">
              <p className="text-xs text-gray-400 mb-1">แผนก</p>
              <p className="text-sm font-semibold text-gray-800">{current.department_name || "—"}</p>
            </div>
            <div className="@3xl:px-6">
              <p className="text-xs text-gray-400 mb-1">ตำแหน่ง</p>
              <p className="text-sm font-semibold text-gray-800">{current.position_name || "—"}</p>
            </div>
            <div className="@3xl:pl-6">
              <p className="text-xs text-gray-400 mb-1">วันที่รับ</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(current.assigned_at)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ประวัติการใช้งาน */}
      <div className="@container bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-3 text-base font-semibold text-[#102E5A]">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#102E5A] text-white">
              <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
              </svg>
            </span>
            ประวัติการใช้งาน
          </h2>
          <span className="text-xs font-medium text-[#102E5A] bg-[#eef2fa] rounded-full px-3 py-1">
            {history.length} รายการ
          </span>
        </div>

        {events.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">ยังไม่มีประวัติการใช้งาน</p>
        ) : (
          <>
          <div className="hidden @3xl:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">วันที่</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ประเภท</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ผู้ใช้งาน</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">หมายเหตุ</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">สถานะ</th>
                  <th className="pb-2" />
                </tr>
              </thead>
              <tbody>
                {events.map(({ key, kind, at, h }) => {
                  const isAssign = kind === "assign";
                  const active = isAssign && !h.returned_at;
                  const returnAction = returnAsset.bind(null, h.id, asset.id);
                  return (
                    <tr key={key} className="border-b border-gray-50 last:border-0 align-top">
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-800">{formatDate(at)}</p>
                      </td>
                      <td className="py-3 pr-4">
                        <p className="font-semibold text-gray-800">{isAssign ? "มอบหมายทรัพย์สิน" : "รับคืนทรัพย์สิน"}</p>
                        {active && (
                          <span className="mt-1 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                            กำลังใช้งาน
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <p className="text-gray-800">
                          {!isAssign && "รับคืนจาก "}
                          <Link href={`/employees/${h.employee_id}`} className="hover:text-[#102E5A] hover:underline">
                            {h.employee_name}
                          </Link>
                        </p>
                        <p className="text-xs text-gray-400">รหัสพนักงาน {h.employee_id_str}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-500">{isAssign ? h.note || "—" : "—"}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                            active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
                          {active ? "Active" : "Closed"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        {active && (
                          <ReturnAssetForm
                            action={returnAction}
                            employeeName={h.employee_name}
                            assetName={asset.asset_name}
                            assetTypeName={asset.asset_type_name}
                            serialNumber={asset.serial_number}
                          />
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Narrow cards (tablet portrait / small windows): one card per event instead of a cramped table */}
          <ul className="@3xl:hidden divide-y divide-gray-100">
            {events.map(({ key, kind, at, h }) => {
              const isAssign = kind === "assign";
              const active = isAssign && !h.returned_at;
              const returnAction = returnAsset.bind(null, h.id, asset.id);
              return (
                <li key={key} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">
                        {isAssign ? "มอบหมายทรัพย์สิน" : "รับคืนทรัพย์สิน"}
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(at)}</p>
                    </div>
                    <span
                      className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                        active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-500" : "bg-gray-400"}`} />
                      {active ? "Active" : "Closed"}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-gray-800">
                    {!isAssign && "รับคืนจาก "}
                    <Link href={`/employees/${h.employee_id}`} className="hover:text-[#102E5A] hover:underline">
                      {h.employee_name}
                    </Link>
                  </p>
                  <p className="text-xs text-gray-400">รหัสพนักงาน {h.employee_id_str}</p>
                  {isAssign && h.note && <p className="mt-1 text-xs text-gray-500">หมายเหตุ: {h.note}</p>}
                  {active && (
                    <div className="mt-2">
                      <ReturnAssetForm
                        action={returnAction}
                        employeeName={h.employee_name}
                        assetName={asset.asset_name}
                        assetTypeName={asset.asset_type_name}
                        serialNumber={asset.serial_number}
                      />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          </>
        )}
      </div>

    </div>
  );
}

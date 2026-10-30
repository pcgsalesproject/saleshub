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

function formatTime(v?: string | null) {
  if (!v) return "";
  const d = new Date(v);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 whitespace-nowrap">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right break-all">{value || "—"}</span>
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
      <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
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
    <div className="flex flex-col gap-4">

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
        <div className="flex items-center gap-2">
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
      <div className="grid gap-4 lg:grid-cols-[7fr_4fr] lg:items-start">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <CardTitle>ข้อมูลทรัพย์สิน</CardTitle>
          <div className="grid md:[grid-template-columns:2fr_3fr] md:gap-x-8">
            <div>
              <Field label="Asset Tag" value={asset.asset_tag} />
              <Field label="ชื่อทรัพย์สิน" value={asset.asset_name} />
              <Field label="ประเภท" value={asset.asset_type_name} />
              <Field label="ยี่ห้อ (Brand)" value={asset.brand} />
              <Field label="รุ่น (Model)" value={asset.model} />
            </div>
            <div className="md:border-l md:border-gray-100 md:pl-8">
              <Field label="Serial Number" value={asset.serial_number} />
              <Field label="EID" value={asset.eid} />
              <Field label="เบอร์โทรศัพท์ (ถ้ามี)" value={asset.phone_number} />
              <div className="flex items-center justify-between gap-4 py-3">
                <span className="text-sm text-gray-400">สถานะ</span>
                <StatusBadge assigned={!!current} status={asset.status} />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <CardTitle>ข้อมูลการจัดซื้อและรับประกัน</CardTitle>
          <Field label="ราคาซื้อ" value={asset.purchase_price != null ? `฿${formatPrice(asset.purchase_price)}` : null} />
          <Field label="เลขที่ใบสั่งซื้อ" value={asset.po_number} />
          <Field label="ผู้จัดจำหน่าย" value={asset.vendor} />
          <Field label="วันที่ซื้อ" value={formatDate(asset.purchase_date)} />
          <Field label="ระยะเวลารับประกัน" value={asset.warranty_conditions} />
          <Field label="วันที่หมดประกัน" value={formatDate(asset.warranty_expiry)} />
          {warranty && (
            <div
              className={`mt-4 rounded-xl p-4 ${
                warranty.daysLeft < 0 ? "bg-red-50" : warranty.daysLeft <= 30 ? "bg-orange-50" : "bg-blue-50"
              }`}
            >
              <p className="text-sm font-semibold text-[#102E5A] mb-2">
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
              <div className="mt-2 flex justify-between text-xs text-gray-500">
                <span>{formatDate(asset.purchase_date)}</span>
                <span>{formatDate(asset.warranty_expiry)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ผู้ครอบครองปัจจุบัน */}
      {current && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5 lg:divide-x lg:divide-gray-100">
            <div className="lg:pr-6">
              <p className="text-xs text-gray-400 mb-1">ชื่อ-นามสกุล</p>
              <Link href={`/employees/${current.employee_id}`} className="text-sm font-semibold text-gray-800 hover:text-[#102E5A] hover:underline">
                {current.employee_name}
              </Link>
            </div>
            <div className="lg:px-6">
              <p className="text-xs text-gray-400 mb-1">รหัสพนักงาน</p>
              <p className="text-sm font-semibold text-gray-800">{current.employee_id_str}</p>
            </div>
            <div className="lg:px-6">
              <p className="text-xs text-gray-400 mb-1">แผนก</p>
              <p className="text-sm font-semibold text-gray-800">{current.department_name || "—"}</p>
            </div>
            <div className="lg:px-6">
              <p className="text-xs text-gray-400 mb-1">ตำแหน่ง</p>
              <p className="text-sm font-semibold text-gray-800">{current.position_name || "—"}</p>
            </div>
            <div className="lg:pl-6">
              <p className="text-xs text-gray-400 mb-1">วันที่รับ</p>
              <p className="text-sm font-semibold text-gray-800">{formatDate(current.assigned_at)}</p>
            </div>
          </div>
        </div>
      )}

      {/* ประวัติการใช้งาน */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
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
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">วันที่ / เวลา</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ประเภท</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">รายละเอียด</th>
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
                        <p className="text-xs text-gray-400">{formatTime(at)}</p>
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
                          {isAssign ? "มอบหมายให้" : "รับคืนจาก"}{" "}
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
        )}
      </div>

    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import type { Asset } from "@/lib/types";
import { returnAsset } from "@/lib/actions/assets";
import ReturnAssetForm from "@/components/ReturnAssetForm";
import AssetTagField from "./AssetTagField";

interface AssignmentRow {
  id: number;
  employee_id_str: string;
  employee_name: string;
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
      e.employee_id AS employee_id_str,
      TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS employee_name,
      aa.assigned_at,
      aa.returned_at,
      aa.note
    FROM asset_assignments aa
    JOIN employees e ON aa.employee_id = e.id
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

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 whitespace-nowrap">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right">{value || "—"}</span>
    </div>
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

  return (
    <div className="flex flex-col gap-4">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/assets" className="text-gray-400 hover:text-gray-700">Assets</Link>
          <span className="text-gray-300">›</span>
          <span className="font-semibold text-gray-800">{asset.asset_tag}</span>
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
            มอบหมาย
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

      {/* Row 1: ข้อมูลทรัพย์สิน + ข้อมูลการจัดซื้อ */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            ข้อมูลทรัพย์สิน
          </h2>
          <AssetTagField assetId={asset.id} assetTag={asset.asset_tag} />
          <Field label="รหัสทรัพย์สิน (บัญชี)" value={asset.asset_code} />
          <Field label="ชื่อทรัพย์สิน" value={asset.asset_name} />
          <Field label="ประเภท" value={asset.asset_type_name} />
          <Field label="ยี่ห้อ" value={asset.brand} />
          <Field label="รุ่น" value={asset.model} />
          <Field label="หมายเลขซีเรียล" value={asset.serial_number} />
          <Field label="เบอร์โทรศัพท์" value={asset.phone_number} />
          <div className="flex items-center justify-between gap-4 py-3">
            <span className="text-sm text-gray-400">สถานะ</span>
            {current ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                Assigned — {current.employee_name}
              </span>
            ) : asset.status === "repair" ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                In Repair
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Available
              </span>
            )}
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            ข้อมูลการจัดซื้อ
          </h2>
          <Field label="ราคาซื้อ" value={asset.purchase_price != null ? `฿${formatPrice(asset.purchase_price)}` : null} />
          <Field label="เลขที่ใบสั่งซื้อ" value={asset.po_number} />
          <Field label="ผู้จัดจำหน่าย" value={asset.vendor} />
          <Field label="เงื่อนไขการรับประกัน" value={asset.warranty_conditions} />
          <Field label="วันที่ซื้อ" value={formatDate(asset.purchase_date)} />
          <Field label="วันที่หมดประกัน" value={formatDate(asset.warranty_expiry)} />
        </div>
      </div>

      {/* ประวัติการใช้งาน */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            ประวัติการใช้งาน
          </h2>
          <span className="text-xs font-medium text-[#102E5A] bg-[#eef2fa] rounded-full px-3 py-1">
            {history.length} รายการ
          </span>
        </div>

        {history.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">ยังไม่มีประวัติการใช้งาน</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">รหัสพนักงาน</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ชื่อ-นามสกุล</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">วันที่รับ</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">วันที่คืน</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">หมายเหตุ</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {history.map((h) => {
                const returnAction = returnAsset.bind(null, h.id, asset.id);
                return (
                <tr key={h.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-4 font-mono text-xs text-gray-500">{h.employee_id_str}</td>
                  <td className="py-3 pr-4 font-medium text-gray-800">
                    <Link href={`/employees/${h.id}`} className="hover:text-[#102E5A] hover:underline">
                      {h.employee_name}
                    </Link>
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{formatDate(h.assigned_at)}</td>
                  <td className="py-3 pr-4">
                    {h.returned_at ? (
                      <span className="text-gray-600">{formatDate(h.returned_at)}</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 bg-blue-50 rounded-full px-2 py-0.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        กำลังใช้งาน
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{h.note || "—"}</td>
                  <td className="py-3 text-right">
                    {!h.returned_at && <ReturnAssetForm action={returnAction} />}
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

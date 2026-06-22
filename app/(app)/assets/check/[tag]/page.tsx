import Link from "next/link";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import type { Asset, AssetCheck } from "@/lib/types";
import { createAssetCheck } from "@/lib/actions/checks";
import SubmitButton from "@/components/SubmitButton";

interface CheckRow extends AssetCheck {
  checked_by_name: string | null;
}

async function getAsset(tag: string): Promise<Asset | null> {
  const rows = await sql<Asset[]>`
    SELECT a.*, at.name AS asset_type_name
    FROM assets a
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    WHERE a.asset_tag = ${tag}
  `;
  return rows[0] ?? null;
}

async function getChecks(assetId: number): Promise<CheckRow[]> {
  return sql<CheckRow[]>`
    SELECT ac.*, TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS checked_by_name
    FROM asset_checks ac
    LEFT JOIN employees e ON ac.checked_by_id = e.id
    WHERE ac.asset_id = ${assetId}
    ORDER BY ac.checked_at DESC
  `;
}

function formatDateTime(v: string) {
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 whitespace-nowrap">{label}</span>
      <span className="text-sm font-semibold text-gray-800 text-right">{value || "—"}</span>
    </div>
  );
}

export default async function AssetCheckPage(props: PageProps<"/assets/check/[tag]">) {
  const { tag } = await props.params;
  const asset = await getAsset(tag);

  if (!asset) notFound();

  const checks = await getChecks(asset.id);
  const action = createAssetCheck.bind(null, asset.id, `/assets/check/${asset.asset_tag}`);

  return (
    <div className="flex flex-col gap-4">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href={`/assets/${asset.id}`} className="text-gray-400 hover:text-gray-700">{asset.asset_tag}</Link>
          <span className="text-gray-300">›</span>
          <span className="font-semibold text-gray-800">ตรวจสอบทรัพย์สิน</span>
        </div>
        <Link
          href={`/assets/${asset.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3.5 py-2 bg-white hover:bg-gray-50 transition-colors"
        >
          ดูรายละเอียดทรัพย์สิน
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">

        {/* Asset summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            ข้อมูลทรัพย์สิน
          </h2>
          <Field label="Asset Tag" value={asset.asset_tag} />
          <Field label="รหัสทรัพย์สิน (บัญชี)" value={asset.asset_code} />
          <Field label="ชื่อทรัพย์สิน" value={asset.asset_name} />
          <Field label="ยี่ห้อ / รุ่น" value={[asset.brand, asset.model].filter(Boolean).join(" ") || null} />
          <Field label="หมายเลขซีเรียล" value={asset.serial_number} />
        </div>

        {/* Check form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            บันทึกผลการตรวจสอบ
          </h2>
          <form action={action} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">สถานะ</label>
              <select name="status" defaultValue="found" className="input">
                <option value="found">✅ พบ</option>
                <option value="missing">⚠️ ไม่พบ</option>
                <option value="damaged">🛡️ เสียหาย</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">หมายเหตุ</label>
              <textarea
                name="comment"
                rows={3}
                placeholder="เช่น เครื่องพัง แนะนำส่งซ่อม"
                className="input"
              />
            </div>
            <SubmitButton label="บันทึกผลการตรวจสอบ" pendingLabel="กำลังบันทึก…" />
          </form>
        </div>

      </div>

      {/* History */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            ประวัติการตรวจสอบ
          </h2>
          <span className="text-xs font-medium text-[#102E5A] bg-[#eef2fa] rounded-full px-3 py-1">
            {checks.length} รายการ
          </span>
        </div>

        {checks.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">ยังไม่มีประวัติการตรวจสอบ</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">วันที่ตรวจ</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ผู้ตรวจสอบ</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">สถานะ</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-4 text-gray-600">{formatDateTime(c.checked_at)}</td>
                  <td className="py-3 pr-4 font-medium text-gray-800">{c.checked_by_name || "—"}</td>
                  <td className="py-3 pr-4">
                    {c.status === "damaged" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-700 bg-purple-50 border border-purple-100 rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        เสียหาย
                      </span>
                    ) : c.status === "missing" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-100 rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        ไม่พบ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-50 border border-green-100 rounded-full px-2.5 py-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        พบ
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-500">{c.comment || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

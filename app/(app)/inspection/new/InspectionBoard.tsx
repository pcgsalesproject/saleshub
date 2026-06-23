"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAssetChecksBatch } from "@/lib/actions/checks";

export interface EmployeeDetail {
  id: number;
  name: string;
  employee_id: string | null;
  position_name: string | null;
  department_name: string | null;
  sales_area_name: string | null;
  email: string | null;
  start_date: string | null;
  is_active: boolean;
  manager_name: string | null;
}

export interface AssignedAsset {
  id: number;
  asset_tag: string;
  asset_code: string | null;
  asset_name: string;
  asset_type_name: string | null;
  serial_number: string | null;
}

interface Props {
  employee: EmployeeDetail;
  assets: AssignedAsset[];
}

type StatusValue = "found" | "missing" | "damaged";

const STATUS_META: Record<StatusValue, { label: string }> = {
  found: { label: "พบ" },
  missing: { label: "ไม่พบ" },
  damaged: { label: "เสียหาย" },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function formatDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear() + 543}`;
}

function StatCard({ icon, label, value, cls }: { icon: React.ReactNode; label: string; value: number; cls: string }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${cls}`}>
      <span className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/70 flex-shrink-0">{icon}</span>
      <div>
        <p className="text-xl font-semibold">{value}</p>
        <p className="text-xs opacity-80">{label}</p>
      </div>
    </div>
  );
}

export default function InspectionBoard({ employee, assets }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<Record<number, { status: StatusValue | null; comment: string }>>(
    () => Object.fromEntries(assets.map((a) => [a.id, { status: null, comment: "" }]))
  );
  const [overallComment, setOverallComment] = useState("");
  const [pending, setPending] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const total = assets.length;
  const checkedCount = assets.filter((a) => rows[a.id]?.status).length;
  const missingCount = assets.filter((a) => rows[a.id]?.status === "missing").length;
  const damagedCount = assets.filter((a) => rows[a.id]?.status === "damaged").length;
  const allFilled = total > 0 && checkedCount === total;

  function setStatus(assetId: number, status: StatusValue) {
    setRows((prev) => ({ ...prev, [assetId]: { ...prev[assetId], status } }));
    setSaved(false);
  }

  function setComment(assetId: number, comment: string) {
    setRows((prev) => ({ ...prev, [assetId]: { ...prev[assetId], comment } }));
    setSaved(false);
  }

  function cancel() {
    router.push("/inspection/new");
  }

  async function handleSave() {
    if (!allFilled) return;
    setPending(true);
    setError(null);
    const result = await createAssetChecksBatch(
      employee.id,
      overallComment || null,
      assets.map((a) => ({
        assetId: a.id,
        status: rows[a.id].status as string,
        comment: rows[a.id].comment || null,
      }))
    );
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">

      {saved && (
        <div className="flex items-center gap-2 px-4 py-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
          บันทึกผลการตรวจสอบของ {employee.name} เรียบร้อย
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Employee card */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#eef2fa] text-[#102E5A] text-lg font-semibold flex-shrink-0">
            {getInitials(employee.name)}
          </span>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold text-gray-800">{employee.name}</p>
              <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                {employee.employee_id ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
              <span>🏢 {employee.department_name ?? "—"}</span>
              <span>💼 {employee.position_name ?? "—"}</span>
              <span>📍 {employee.sales_area_name ?? "—"}</span>
              {employee.email && <span>✉️ {employee.email}</span>}
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-gray-500 space-y-1 flex-shrink-0">
          <p>วันที่เริ่มงาน <span className="font-medium text-gray-700">{formatDate(employee.start_date)}</span></p>
          <p>
            สถานะพนักงาน{" "}
            <span className={`font-medium rounded-full px-2 py-0.5 ${employee.is_active ? "text-green-700 bg-green-50" : "text-gray-500 bg-gray-100"}`}>
              {employee.is_active ? "ปฏิบัติงาน" : "ไม่ปฏิบัติงาน"}
            </span>
          </p>
          <p>ผู้จัดการ <span className="font-medium text-gray-700">{employee.manager_name ?? "—"}</span></p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<span>🔒</span>}
          label="ทรัพย์สินทั้งหมด"
          value={total}
          cls="bg-blue-50 border-blue-100 text-blue-700"
        />
        <StatCard
          icon={<span>✅</span>}
          label="ตรวจสอบแล้ว"
          value={checkedCount}
          cls="bg-green-50 border-green-100 text-green-700"
        />
        <StatCard
          icon={<span>⚠️</span>}
          label="ไม่พบ"
          value={missingCount}
          cls="bg-orange-50 border-orange-100 text-orange-700"
        />
        <StatCard
          icon={<span>🛡️</span>}
          label="เสียหาย"
          value={damagedCount}
          cls="bg-purple-50 border-purple-100 text-purple-700"
        />
      </div>

      {/* Asset table */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          รายการทรัพย์สินที่มอบหมาย
        </h2>

        {assets.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">พนักงานคนนี้ไม่มีทรัพย์สินที่ถืออยู่</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">#</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">รหัสทรัพย์สิน</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ชื่อทรัพย์สิน</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ประเภท</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">สถานะการใช้งาน</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ผลตรวจสอบ</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">หมายเหตุ</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((a, i) => {
                const row = rows[a.id];
                return (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0">
                    <td className="py-3 pr-4 text-gray-400">{i + 1}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500">{a.asset_tag}</td>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-800">{a.asset_name}</p>
                      <p className="text-xs text-gray-400">SN: {a.serial_number ?? "—"}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{a.asset_type_name ?? "—"}</td>
                    <td className="py-3 pr-4">
                      <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                        In Use
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        {(Object.keys(STATUS_META) as StatusValue[]).map((s) => (
                          <label key={s} className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                            <input
                              type="radio"
                              name={`status-${a.id}`}
                              checked={row.status === s}
                              onChange={() => setStatus(a.id, s)}
                              className="accent-[#102E5A]"
                            />
                            {STATUS_META[s].label}
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <input
                        type="text"
                        value={row.comment}
                        onChange={(e) => setComment(a.id, e.target.value)}
                        placeholder="-"
                        className="input w-48"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Overall comment */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <label className="block text-sm font-medium text-gray-700 mb-1.5">หมายเหตุโดยรวม</label>
        <textarea
          value={overallComment}
          onChange={(e) => setOverallComment(e.target.value)}
          rows={3}
          placeholder="ระบุหมายเหตุเพิ่มเติม (ถ้ามี)"
          className="input w-full"
        />
      </div>

      {/* Bottom save bar */}
      <div className="flex items-center justify-between bg-white border border-gray-200 rounded-xl px-6 py-4 sticky bottom-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          สรุปผลการตรวจสอบ: ตรวจสอบแล้ว {checkedCount}/{total} รายการ
          {missingCount > 0 && (
            <span className="text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 rounded-full px-2 py-0.5">
              ไม่พบ {missingCount} รายการ
            </span>
          )}
          {damagedCount > 0 && (
            <span className="text-xs font-medium text-purple-700 bg-purple-50 border border-purple-200 rounded-full px-2 py-0.5">
              เสียหาย {damagedCount} รายการ
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={cancel}
            className="text-sm text-gray-600 border border-gray-200 rounded-lg px-4 py-2 bg-white hover:bg-gray-50 transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!allFilled || pending}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "กำลังบันทึก…" : "บันทึกผลการตรวจสอบ"}
          </button>
        </div>
      </div>

    </div>
  );
}

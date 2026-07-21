"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createAssetChecksBatch } from "@/lib/actions/checks";
import type { RoundHistoryRow } from "@/lib/inspection-shared";

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
  history: RoundHistoryRow[];
}

type StatusValue = "found" | "missing" | "damaged";

const STATUS_META: Record<StatusValue, { label: string; dot: string; badge: string }> = {
  found: { label: "พบครบถ้วน", dot: "text-green-600", badge: "bg-green-50 text-green-700 border-green-200" },
  missing: { label: "ไม่พบ", dot: "text-orange-500", badge: "bg-orange-50 text-orange-700 border-orange-200" },
  damaged: { label: "ไม่เกี่ยวข้อง", dot: "text-gray-400", badge: "bg-gray-100 text-gray-500 border-gray-200" },
};

const COMMENT_MAX = 100;

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function formatDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear() + 543}`;
}

function formatGregorianDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear()}`;
}

function StatCard({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <div className={`flex flex-col gap-1 rounded-xl border p-4 ${cls}`}>
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs opacity-80">{label}</p>
    </div>
  );
}

export default function InspectionBoard({ employee, assets, history }: Props) {
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

  const currentRound = history.find((h) => h.round_status === "open");

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
    router.back();
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
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#eef2fa] text-[#102E5A] text-lg font-semibold flex-shrink-0">
            {getInitials(employee.name)}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
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
        <div className="text-left sm:text-right text-xs text-gray-500 space-y-1 flex-shrink-0 max-w-full sm:max-w-xs">
          {currentRound && (
            <p className="whitespace-normal">
              สถานะการตรวจสอบ{" "}
              <span
                className={`inline-flex items-center font-medium rounded-full px-2 py-0.5 whitespace-nowrap ${
                  currentRound.checked_assets > 0 ? "text-green-700 bg-green-50" : "text-orange-700 bg-orange-50"
                }`}
              >
                {currentRound.checked_assets > 0 ? "ตรวจสอบแล้ว" : "ยังไม่ได้ตรวจ"} {currentRound.round_name} (
                {currentRound.round_year + 543})
              </span>
            </p>
          )}
          <p className="whitespace-nowrap">วันที่เริ่มงาน <span className="font-medium text-gray-700">{formatDate(employee.start_date)}</span></p>
          <p className="whitespace-nowrap">
            สถานะพนักงาน{" "}
            <span className={`font-medium rounded-full px-2 py-0.5 ${employee.is_active ? "text-green-700 bg-green-50" : "text-gray-500 bg-gray-100"}`}>
              {employee.is_active ? "ปฏิบัติงาน" : "ไม่ปฏิบัติงาน"}
            </span>
          </p>
          <p className="whitespace-nowrap">ผู้จัดการ <span className="font-medium text-gray-700">{employee.manager_name ?? "—"}</span></p>
        </div>
      </div>

      {/* Inspection history across rounds */}
      {history.some((h) => h.checked_assets > 0) && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            ประวัติการตรวจสอบ
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">สถานะการตรวจสอบ</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">รอบการตรวจ</th>
                  <th className="text-right text-xs font-medium text-gray-400 pb-2 whitespace-nowrap">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {history.map((h) => {
                  const buddhistYear = h.round_year + 543;
                  const roundLabel = `รอบปี ${buddhistYear} (${h.round_year})`;
                  const notStarted = h.checked_assets === 0;
                  const hasProblem = h.problem_assets > 0;
                  return (
                    <tr key={h.round_id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 align-top">
                        <div className="flex items-center gap-2">
                          {notStarted ? (
                            <svg className="w-4 h-4 text-orange-500 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          ) : hasProblem ? (
                            <svg className="w-4 h-4 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 100 20 10 10 0 000-20zm3.03 6.97a.75.75 0 00-1.06 0L12 10.94 9.03 7.97a.75.75 0 10-1.06 1.06L10.94 12l-2.97 2.97a.75.75 0 101.06 1.06L12 13.06l2.97 2.97a.75.75 0 101.06-1.06L13.06 12l2.97-2.97a.75.75 0 000-1.06z" />
                            </svg>
                          ) : (
                            <svg className="w-4 h-4 text-green-600 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                              <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.28 7.22a.75.75 0 00-1.06-1.06L10.5 12.88l-1.72-1.72a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z" />
                            </svg>
                          )}
                          <span className="font-medium text-gray-800 whitespace-nowrap">
                            {notStarted ? "ยังไม่ได้ตรวจ" : hasProblem ? "ไม่พบ/เสียหาย" : "ตรวจสอบแล้ว"}
                          </span>
                        </div>
                        {!notStarted && (
                          <div className="mt-1 ml-6 space-y-0.5 text-xs text-gray-400 whitespace-nowrap">
                            <p>📅 {roundLabel}</p>
                            <p>📅 ตรวจวันที่ {formatGregorianDate(h.last_checked_at)}</p>
                          </div>
                        )}
                      </td>
                      <td className="py-3 pr-4 align-top">
                        {notStarted ? (
                          <span className="text-gray-300">-</span>
                        ) : (
                          <span
                            className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 border whitespace-nowrap ${
                              hasProblem ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
                            }`}
                          >
                            {roundLabel}
                          </span>
                        )}
                      </td>
                      <td className="py-3 align-top text-right">
                        {notStarted ? (
                          <a
                            href="#check-form"
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap bg-[#102E5A] text-white hover:bg-[#0b2145] transition-colors"
                          >
                            เริ่มตรวจ
                          </a>
                        ) : (
                          <Link
                            href={`/inspection/history/${employee.id}/${h.round_id}`}
                            className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap border border-[#102E5A] text-[#102E5A] hover:bg-[#102E5A]/5 transition-colors"
                          >
                            ดูผลการตรวจ
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          label="ทรัพย์สินทั้งหมด"
          value={total}
          cls="bg-blue-50 border-blue-100 text-blue-700"
        />
        <StatCard
          label="ตรวจสอบแล้ว"
          value={checkedCount}
          cls="bg-green-50 border-green-100 text-green-700"
        />
        <StatCard
          label="ไม่พบ"
          value={missingCount}
          cls="bg-orange-50 border-orange-100 text-orange-700"
        />
        <StatCard
          label="เสียหาย"
          value={damagedCount}
          cls="bg-purple-50 border-purple-100 text-purple-700"
        />
      </div>

      {/* Asset table */}
      <div id="check-form" className="bg-white border border-gray-200 rounded-xl p-6 scroll-mt-4">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          รายการทรัพย์สินที่มอบหมาย
        </h2>

        {assets.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">พนักงานคนนี้ไม่มีทรัพย์สินที่ถืออยู่</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">#</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">รหัสทรัพย์สิน</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">ชื่อทรัพย์สิน</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">ประเภท</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">สถานะการใช้งาน</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">ตรวจสอบ</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">สถานะหลังตรวจ</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a, i) => {
                  const row = rows[a.id];
                  return (
                    <tr key={a.id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 text-gray-400 align-top">{i + 1}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-500 whitespace-nowrap align-top">{a.asset_tag}</td>
                      <td className="py-3 pr-4 align-top">
                        <p className="font-medium text-gray-800 whitespace-nowrap">{a.asset_name}</p>
                        <p className="text-xs text-gray-400 whitespace-nowrap">SN: {a.serial_number ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 whitespace-nowrap align-top">{a.asset_type_name ?? "—"}</td>
                      <td className="py-3 pr-4 align-top">
                        <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                          In Use
                        </span>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <div className="flex flex-col gap-2">
                          {(Object.keys(STATUS_META) as StatusValue[]).map((s) => {
                            const checked = row.status === s;
                            return (
                              <label key={s} className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer whitespace-nowrap">
                                <input
                                  type="radio"
                                  name={`status-${a.id}`}
                                  checked={checked}
                                  onChange={() => setStatus(a.id, s)}
                                  className="sr-only"
                                />
                                {checked ? (
                                  <svg className={`w-4 h-4 flex-shrink-0 ${STATUS_META[s].dot}`} fill="currentColor" viewBox="0 0 24 24">
                                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2a10 10 0 100 20 10 10 0 000-20zm4.28 7.22a.75.75 0 00-1.06-1.06L10.5 12.88l-1.72-1.72a.75.75 0 10-1.06 1.06l2.25 2.25a.75.75 0 001.06 0l4.25-4.25z" />
                                  </svg>
                                ) : (
                                  <span className="w-4 h-4 flex-shrink-0 rounded-full border-2 border-gray-300" />
                                )}
                                {STATUS_META[s].label}
                              </label>
                            );
                          })}
                        </div>
                      </td>
                      <td className="py-3 pr-4 align-top">
                        {row.status ? (
                          <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 border whitespace-nowrap ${STATUS_META[row.status].badge}`}>
                            {STATUS_META[row.status].label}
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 border bg-gray-50 text-gray-400 border-gray-200 whitespace-nowrap">
                            ยังไม่ตรวจ
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 align-top">
                        <textarea
                          value={row.comment}
                          onChange={(e) => setComment(a.id, e.target.value.slice(0, COMMENT_MAX))}
                          maxLength={COMMENT_MAX}
                          rows={2}
                          placeholder="ระบุหมายเหตุ (ถ้ามี)"
                          className="input w-48 resize-none"
                        />
                        <p className="mt-1 text-right text-[11px] text-gray-400">
                          {row.comment.length}/{COMMENT_MAX}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-gray-200 rounded-xl px-6 py-4 sticky bottom-4">
        <div className="flex items-center gap-2 flex-wrap text-sm text-gray-600">
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

"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { FormActionState } from "@/lib/actions/assets";
import {
  CHANGE_TYPES,
  type ChangeHistoryRow,
  type ChangeTypeDef,
  type ChangeTypeKey,
  type MasterOption,
} from "@/lib/employee-change-types";

type Action = (prev: FormActionState | undefined, formData: FormData) => Promise<FormActionState>;

interface Props {
  rows: ChangeHistoryRow[];
  action: Action;
  canEdit: boolean;
  /** current profile values, shown read-only as "before" in the form */
  current: Record<ChangeTypeKey, { id: number | null; name: string | null }>;
  options: Record<ChangeTypeKey, MasterOption[]>;
}

function formatDate(ymd: string) {
  const [y, m, d] = ymd.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

function todayBangkok() {
  return new Date().toLocaleDateString("sv-SE", { timeZone: "Asia/Bangkok" });
}

const ICON_PATHS: Record<ChangeTypeKey, string> = {
  department_transfer:
    "M3.75 21h16.5M4.5 3h15v18h-15V3zM8.25 7.5h1.5m4.5 0h1.5M8.25 11.25h1.5m4.5 0h1.5M8.25 15h1.5m4.5 0h1.5",
  sales_area_transfer:
    "M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z",
  position_adjustment: "M3 13.125h4.5V21H3v-7.875zM9.75 8.625h4.5V21h-4.5V8.625zM16.5 3.75H21V21h-4.5V3.75z",
};

function TypeIcon({ type, className = "h-4 w-4" }: { type: ChangeTypeKey; className?: string }) {
  return (
    <svg fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d={ICON_PATHS[type]} />
    </svg>
  );
}

const typeOf = (key: ChangeTypeKey) => CHANGE_TYPES.find((t) => t.key === key)!;

export default function ChangeHistoryTimeline({ rows, action, canEdit, current, options }: Props) {
  const [filter, setFilter] = useState<ChangeTypeKey | "all">("all");
  const [open, setOpen] = useState(false);

  const visible = filter === "all" ? rows : rows.filter((r) => r.change_type === filter);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-gray-800">ประวัติการเปลี่ยนแปลง</h2>
          <span className="text-xs text-gray-400">{rows.length} รายการ</span>
        </div>
        {canEdit && rows.length > 0 && (
          <button type="button" onClick={() => setOpen(true)} className="btn-primary !py-1.5 !px-3 !text-xs">
            + บันทึกการเปลี่ยนแปลง
          </button>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {([{ key: "all", label: "ทั้งหมด" }, ...CHANGE_TYPES] as { key: ChangeTypeKey | "all"; label: string }[]).map((t) => {
            const count = t.key === "all" ? rows.length : rows.filter((r) => r.change_type === t.key).length;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setFilter(t.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                  filter === t.key
                    ? "border-[#102E5A] bg-[#102E5A] text-white"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {t.key !== "all" && <TypeIcon type={t.key} className="h-3.5 w-3.5" />}
                {t.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-gray-400">ยังไม่มีประวัติการเปลี่ยนแปลง</p>
          {canEdit && (
            <button type="button" onClick={() => setOpen(true)} className="btn-primary">
              บันทึกรายการ
            </button>
          )}
        </div>
      ) : visible.length === 0 ? (
        <p className="py-8 text-center text-sm text-gray-400">ไม่มีรายการในประเภทนี้</p>
      ) : (
        <ol className="relative">
          {/* vertical line behind the icons */}
          <span aria-hidden className="absolute left-5 top-5 bottom-5 w-0.5 -translate-x-1/2 bg-gray-200" />
          {visible.map((r) => {
            const t = typeOf(r.change_type);
            return (
              <li key={r.id} className="relative flex gap-4 pb-4 last:pb-0">
                <span className={`z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-white ${t.dot}`}>
                  <TypeIcon type={t.key} className="h-5 w-5" />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <div className="sm:w-28 sm:shrink-0">
                    <p className="text-sm font-semibold text-[#102E5A]">{formatDate(r.effective_date)}</p>
                    <p className="text-xs text-gray-400">มีผลตั้งแต่</p>
                  </div>
                  <div className={`flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border px-4 py-3 ${t.tint}`}>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${t.chip}`}>{t.label}</span>
                    <span className="text-sm font-semibold text-gray-700">{r.old_value.name ?? "—"}</span>
                    <span className="text-gray-400">→</span>
                    <span className="text-sm font-bold text-gray-900">{r.new_value.name ?? "—"}</span>
                    {r.status === "pending" && (
                      <span className="rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-700">รอมีผล</span>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {open && <ChangePanel action={action} current={current} options={options} onClose={() => setOpen(false)} />}
    </div>
  );
}

function ChangePanel({
  action,
  current,
  options,
  onClose,
}: {
  action: Action;
  current: Props["current"];
  options: Props["options"];
  onClose: () => void;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [typeKey, setTypeKey] = useState<ChangeTypeKey>("department_transfer");
  const type: ChangeTypeDef = typeOf(typeKey);
  const before = current[typeKey];

  // A successful save returns {} (no error): close the panel
  useEffect(() => {
    if (state && !state.error) onClose();
  }, [state, onClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pending, onClose]);

  return createPortal(
    <div
      onClick={() => !pending && onClose()}
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}
    >
      <form
        action={formAction}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="บันทึกการเปลี่ยนแปลง"
        className="flex h-full w-full max-w-md flex-col bg-white shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h3 className="text-base font-semibold text-gray-800">บันทึกการเปลี่ยนแปลง</h3>
          <button type="button" onClick={onClose} disabled={pending} aria-label="ปิด" className="text-gray-400 hover:text-gray-600">
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          <div>
            <p className="mb-2 text-xs font-medium text-gray-500">ประเภทการเปลี่ยนแปลง</p>
            <div className="grid grid-cols-3 gap-2">
              {CHANGE_TYPES.map((t) => (
                <label
                  key={t.key}
                  className={`cursor-pointer rounded-lg border px-2 py-2.5 text-center text-xs font-medium transition-colors ${
                    typeKey === t.key ? `${t.chip} ${t.border}` : "border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="change_type"
                    value={t.key}
                    checked={typeKey === t.key}
                    onChange={() => setTypeKey(t.key)}
                    className="sr-only"
                  />
                  {t.label}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-gray-500">{type.oldLabel}</label>
            <input className="input-readonly" value={before.name ?? "—"} readOnly tabIndex={-1} />
          </div>

          <div>
            <label htmlFor="new_id" className="mb-1 block text-xs font-medium text-gray-500">
              {type.newLabel} <span className="text-red-500">*</span>
            </label>
            {/* key resets the selection when the type changes */}
            <select key={typeKey} id="new_id" name="new_id" required defaultValue="" className="input">
              <option value="" disabled>เลือก{type.newLabel}</option>
              {options[typeKey]
                .filter((o) => o.id !== before.id)
                .map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="effective_date" className="mb-1 block text-xs font-medium text-gray-500">
              วันที่มีผล <span className="text-red-500">*</span>
            </label>
            <input id="effective_date" name="effective_date" type="date" required defaultValue={todayBangkok()} className="input" />
            <p className="mt-1 text-xs text-gray-400">
              ถ้าเป็นวันในอนาคต รายการจะเป็น &quot;รอมีผล&quot; และข้อมูลปัจจุบันจะเปลี่ยนเมื่อถึงวันดังกล่าว
            </p>
          </div>

          {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
        </div>

        <div className="flex justify-end gap-2 border-t border-gray-100 px-6 py-4">
          <button type="button" onClick={onClose} disabled={pending} className="btn-secondary">ยกเลิก</button>
          <button type="submit" disabled={pending} className="btn-primary">
            {pending ? "กำลังบันทึก…" : "บันทึก"}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
}

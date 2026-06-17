"use client";

import { useState } from "react";
import SubmitButton from "@/components/SubmitButton";

interface Employee {
  id: number;
  employee_id: string;
  name: string;
  department_name: string | null;
  position_name: string | null;
}

interface Props {
  action: (formData: FormData) => Promise<void>;
  employees: Employee[];
}

export default function AssignForm({ action, employees }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Employee | null>(null);

  const filtered = search.length < 1 ? [] : employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q) ||
      (e.department_name ?? "").toLowerCase().includes(q)
    );
  });

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="employee_id" value={selected?.id ?? ""} />

      {/* Employee search */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          พนักงาน <span className="text-red-500">*</span>
        </label>

        {selected ? (
          <div className="flex items-center justify-between p-3 border border-[#102E5A] rounded-lg bg-[#f5f8ff]">
            <div>
              <p className="text-sm font-semibold text-gray-800">{selected.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{selected.employee_id} · {selected.department_name ?? "—"}</p>
            </div>
            <button
              type="button"
              onClick={() => { setSelected(null); setSearch(""); }}
              className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
            >
              เปลี่ยน
            </button>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ค้นหาชื่อ หรือ รหัสพนักงาน..."
              className="input w-full"
              autoComplete="off"
            />
            {filtered.length > 0 && (
              <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
                {filtered.map((e) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      onClick={() => { setSelected(e); setSearch(""); }}
                      className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-800">{e.name}</p>
                      <p className="text-xs text-gray-400">{e.employee_id} · {e.department_name ?? "—"} · {e.position_name ?? "—"}</p>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {search.length > 0 && filtered.length === 0 && (
              <p className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow px-4 py-3 text-sm text-gray-400">
                ไม่พบพนักงาน
              </p>
            )}
          </div>
        )}
      </div>

      {/* Date */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่รับทรัพย์สิน</label>
        <input
          type="date"
          name="assigned_at"
          defaultValue={new Date().toISOString().slice(0, 10)}
          className="input"
        />
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">หมายเหตุ</label>
        <textarea
          name="note"
          rows={3}
          placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
          className="input"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-1">
        <SubmitButton
          label="ยืนยันมอบหมาย"
          pendingLabel="กำลังบันทึก…"
        />
      </div>
    </form>
  );
}

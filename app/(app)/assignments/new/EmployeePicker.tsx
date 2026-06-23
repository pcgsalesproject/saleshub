"use client";

import { useState } from "react";

interface Employee {
  id: number;
  employee_id: string | null;
  name: string;
  department_name: string | null;
  position_name: string | null;
}

interface Props {
  employees: Employee[];
  value: Employee | null;
  onChange: (employee: Employee | null) => void;
  placeholder?: string;
}

export default function EmployeePicker({ employees, value, onChange, placeholder }: Props) {
  const [search, setSearch] = useState("");

  const filtered = search.length < 1 ? [] : employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      (e.employee_id ?? "").toLowerCase().includes(q) ||
      (e.department_name ?? "").toLowerCase().includes(q)
    );
  });

  if (value) {
    return (
      <div className="flex items-center justify-between w-full px-3 py-2.5 border border-[#102E5A] rounded-lg bg-[#f5f8ff]">
        <p className="text-sm font-semibold text-gray-800">{value.name}</p>
        <button
          type="button"
          onClick={() => { onChange(null); setSearch(""); }}
          className="text-xs text-gray-400 hover:text-gray-700 border border-gray-200 rounded px-2 py-1"
        >
          เปลี่ยน
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={placeholder ?? "ค้นหาชื่อ หรือ รหัสพนักงาน..."}
        className="input w-full"
        autoComplete="off"
      />
      {filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-56 overflow-y-auto">
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => { onChange(e); setSearch(""); }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800">{e.name}</p>
                <p className="text-xs text-gray-400">{e.employee_id ?? "—"} · {e.department_name ?? "—"} · {e.position_name ?? "—"}</p>
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
  );
}

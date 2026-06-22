"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface Option {
  id: number;
  name: string;
  employee_id: string;
  email: string | null;
}

interface Props {
  employees: Option[];
}

export default function EmployeeSearch({ employees }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = search.length < 1 ? [] : employees.filter((e) => {
    const q = search.toLowerCase();
    return (
      e.name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q) ||
      (e.email ?? "").toLowerCase().includes(q)
    );
  });

  function select(id: number) {
    setSearch("");
    router.push(`/inspection/new?employee_id=${id}`);
  }

  return (
    <div className="relative w-full max-w-md">
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาจากชื่อ, รหัสพนักงาน, อีเมล..."
          className="input w-full pl-9"
          autoComplete="off"
        />
      </div>
      {filtered.length > 0 && (
        <ul className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          {filtered.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => select(e.id)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-medium text-gray-800">{e.name}</p>
                <p className="text-xs text-gray-400">{e.employee_id} · {e.email ?? "—"}</p>
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

"use client";

import { useRouter } from "next/navigation";

interface Department {
  id: number;
  name: string;
}

interface MonthOption {
  value: string;
  label: string;
}

interface Props {
  departments: Department[];
  months: MonthOption[];
  departmentId: string;
  month: string;
}

export default function FilterBar({ departments, months, departmentId, month }: Props) {
  const router = useRouter();

  function update(next: { departmentId?: string; month?: string }) {
    const params = new URLSearchParams();
    const d = next.departmentId ?? departmentId;
    const m = next.month ?? month;
    if (d) params.set("department_id", d);
    if (m) params.set("month", m);
    router.push(`/inspection/summary${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">ฝ่าย</label>
        <select value={departmentId} onChange={(e) => update({ departmentId: e.target.value })} className="input">
          <option value="">ทั้งหมด</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-gray-500">เดือน</label>
        <select value={month} onChange={(e) => update({ month: e.target.value })} className="input">
          {months.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

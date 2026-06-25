"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface Department {
  id: number;
  name: string;
}

interface Props {
  departments: Department[];
  departmentId: string;
}

export default function DepartmentFilter({ departments, departmentId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("department_id", value);
    else params.delete("department_id");
    router.push(`/inspection/new${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-gray-500 whitespace-nowrap">ฝ่าย</label>
      <select value={departmentId} onChange={(e) => update(e.target.value)} className="input w-64">
        <option value="">ทั้งหมด</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
    </div>
  );
}

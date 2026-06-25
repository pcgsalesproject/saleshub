"use client";

import { useRouter } from "next/navigation";

interface Department {
  id: number;
  name: string;
}

interface RoundOption {
  id: number;
  year: number;
  name: string;
  status: "open" | "closed";
}

interface Props {
  departments: Department[];
  rounds: RoundOption[];
  departmentId: string;
  roundId: string;
}

export default function FilterBar({ departments, rounds, departmentId, roundId }: Props) {
  const router = useRouter();

  function update(next: { departmentId?: string; roundId?: string }) {
    const params = new URLSearchParams();
    const d = next.departmentId ?? departmentId;
    const r = next.roundId ?? roundId;
    if (d) params.set("department_id", d);
    if (r) params.set("round_id", r);
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
        <label className="text-sm text-gray-500 whitespace-nowrap">รอบการตรวจสอบ</label>
        <select value={roundId} onChange={(e) => update({ roundId: e.target.value })} className="input min-w-[20rem]">
          {rounds.length === 0 && <option value="">ยังไม่มีรอบ</option>}
          {rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name} ({r.year + 543})
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

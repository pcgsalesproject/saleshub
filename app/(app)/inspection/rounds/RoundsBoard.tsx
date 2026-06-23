"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createRound, closeRound, reopenRound, type InspectionRound } from "@/lib/actions/rounds";

interface Props {
  rounds: InspectionRound[];
}

function formatDateTime(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear() + 543}`;
}

export default function RoundsBoard({ rounds }: Props) {
  const router = useRouter();
  const now = new Date().getFullYear();
  const [year, setYear] = useState(String(now));
  const [name, setName] = useState(`ตรวจสอบประจำปี ${now + 543}`);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate() {
    const y = Number(year);
    if (!y || !name.trim()) return;
    setPending(true);
    setError(null);
    try {
      await createRound(y, name.trim());
      router.refresh();
    } catch {
      setError("ไม่สามารถสร้างรอบได้ อาจมีรอบของปีนี้อยู่แล้ว");
    }
    setPending(false);
  }

  async function handleClose(id: number) {
    setPending(true);
    await closeRound(id);
    router.refresh();
    setPending(false);
  }

  async function handleReopen(id: number) {
    setPending(true);
    await reopenRound(id);
    router.refresh();
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-4">

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Create round form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          สร้างรอบการตรวจสอบใหม่
        </h2>
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">ปี (ค.ศ.)</label>
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className="input w-28"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs text-gray-500 mb-1">ชื่อรอบ</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input w-full"
            />
          </div>
          <button
            type="button"
            onClick={handleCreate}
            disabled={pending}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "กำลังบันทึก…" : "สร้างรอบ"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          การสร้างรอบใหม่จะปิดรอบที่เปิดอยู่ในปัจจุบันโดยอัตโนมัติ
        </p>
      </div>

      {/* Rounds list */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          รอบการตรวจสอบทั้งหมด
        </h2>
        {rounds.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">ยังไม่มีรอบการตรวจสอบ</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ปี</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">ชื่อรอบ</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">สถานะ</th>
                <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4">สร้างเมื่อ</th>
                <th className="pb-2" />
              </tr>
            </thead>
            <tbody>
              {rounds.map((r) => (
                <tr key={r.id} className="border-b border-gray-50 last:border-0">
                  <td className="py-3 pr-4 text-gray-600">{r.year + 543}</td>
                  <td className="py-3 pr-4 font-medium text-gray-800">{r.name}</td>
                  <td className="py-3 pr-4">
                    {r.status === "open" ? (
                      <span className="inline-flex items-center text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1">
                        🟢 เปิดอยู่
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-xs font-medium text-gray-500 bg-gray-50 border border-gray-200 rounded-full px-2.5 py-1">
                        ⚪ ปิดแล้ว
                      </span>
                    )}
                  </td>
                  <td className="py-3 pr-4 text-gray-600">{formatDateTime(r.created_at)}</td>
                  <td className="py-3 text-right">
                    {r.status === "open" ? (
                      <button
                        type="button"
                        onClick={() => handleClose(r.id)}
                        disabled={pending}
                        className="text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50 transition-colors disabled:opacity-40"
                      >
                        ปิดรอบ
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleReopen(r.id)}
                        disabled={pending}
                        className="text-xs font-medium text-[#102E5A] border border-[#102E5A] rounded-lg px-2.5 py-1 hover:bg-[#eef2fa] transition-colors disabled:opacity-40"
                      >
                        เปิดรอบอีกครั้ง
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}

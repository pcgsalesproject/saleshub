"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { createRound, type InspectionRound } from "@/lib/actions/rounds";

interface Props {
  round: InspectionRound | null;
}

export default function RoundBanner({ round }: Props) {
  const router = useRouter();
  const now = new Date().getFullYear();
  const [year, setYear] = useState(String(now));
  const [name, setName] = useState(`ตรวจสอบประจำปี ${now + 543}`);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (round) {
    return (
      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
        <span className="text-sm text-green-800">
          รอบการตรวจสอบปัจจุบัน: <span className="font-medium">{round.name}</span> ({round.year + 543})
        </span>
        <Link href="/inspection/rounds" className="text-xs font-medium text-green-700 hover:underline">
          จัดการรอบการตรวจสอบ
        </Link>
      </div>
    );
  }

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

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="text-sm text-orange-800">ยังไม่มีรอบการตรวจสอบที่เปิดอยู่ ต้องสร้างก่อนเริ่มตรวจสอบ</span>
        <div className="flex items-center gap-2">
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="input w-24"
          />
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input w-56"
          />
          <button
            type="button"
            onClick={handleCreate}
            disabled={pending}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "กำลังสร้าง…" : "สร้างรอบ"}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-700 mt-2">{error}</p>}
    </div>
  );
}

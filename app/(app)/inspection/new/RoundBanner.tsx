"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { createRound, type InspectionRound } from "@/lib/actions/rounds";

interface Stats {
  total: number;
  checked: number;
  problem: number;
  none: number;
}

interface Props {
  round: InspectionRound | null;
  stats: Stats;
}

function StatPill({ icon, iconWrap, label, value }: { icon: React.ReactNode; iconWrap: string; label: string; value: number }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 min-w-[8.5rem]">
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${iconWrap}`}>{icon}</div>
      <div>
        <p className="text-lg font-semibold text-gray-900 leading-tight">{value}</p>
        <p className="text-xs text-gray-400 whitespace-nowrap">{label}</p>
      </div>
    </div>
  );
}

export default function RoundBanner({ round, stats }: Props) {
  const router = useRouter();
  const now = new Date().getFullYear();
  const [year, setYear] = useState(String(now));
  const [name, setName] = useState(`ตรวจสอบประจำปี ${now + 543}`);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!round) {
    return (
      <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <span className="text-sm text-orange-800">ยังไม่มีรอบการตรวจสอบที่เปิดอยู่ ต้องสร้างก่อนเริ่มตรวจสอบ</span>
          <div className="flex items-center gap-2 flex-wrap">
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
              onClick={async () => {
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
              }}
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

  const pct = stats.total > 0 ? Math.round((stats.checked / stats.total) * 100) : 0;
  const remaining = Math.max(stats.total - stats.checked, 0);
  const buddhistYear = round.year + 543;

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      <div className="flex-1 min-w-0 rounded-xl border border-gray-100 bg-white p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="text-xs text-gray-400">รอบการตรวจสอบปัจจุบัน</p>
            <p className="text-sm font-semibold text-green-600">
              {round.name} ({buddhistYear})
            </p>
          </div>
          <Link href="/inspection/rounds" className="text-xs font-medium text-[#102E5A] hover:underline whitespace-nowrap">
            จัดการรอบการตรวจสอบ →
          </Link>
        </div>

        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          1 ม.ค. {buddhistYear} - 31 ธ.ค. {buddhistYear}
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-sm text-gray-500">ความคืบหน้าการตรวจสอบ</span>
            <span className="text-sm font-semibold text-gray-900">
              {stats.checked} / {stats.total} คน
            </span>
          </div>
          <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-green-400 to-green-500 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-xs text-gray-400">
            <span>{pct}%</span>
            <span>เหลืออีก {remaining} คน</span>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 lg:flex-shrink-0 lg:justify-end">
        <StatPill
          label="ทั้งหมด"
          value={stats.total}
          iconWrap="bg-blue-50 text-blue-600"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-3.13a4 4 0 10-4-4 4 4 0 004 4zm6 0a4 4 0 10-3-6.65" />
            </svg>
          }
        />
        <StatPill
          label="ตรวจแล้ว"
          value={stats.checked}
          iconWrap="bg-green-50 text-green-600"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <StatPill
          label="พบปัญหา"
          value={stats.problem}
          iconWrap="bg-orange-50 text-orange-600"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatPill
          label="ยังไม่ตรวจ"
          value={stats.none}
          iconWrap="bg-gray-100 text-gray-500"
          icon={
            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
      </div>
    </div>
  );
}

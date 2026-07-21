"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { badgeFor, type InspectionRow } from "@/lib/inspection-shared";

interface Department {
  id: number;
  name: string;
}

interface Props {
  rows: InspectionRow[];
  departments: Department[];
  departmentId: string;
}

type StatusFilter = "all" | "ok" | "problem" | "partial" | "none";
type SortKey = "name_asc" | "name_desc" | "status";
type ViewMode = "grid" | "list";

const STATUS_OPTIONS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "ทั้งหมด" },
  { value: "ok", label: "ตรวจแล้ว" },
  { value: "problem", label: "พบปัญหา" },
  { value: "partial", label: "ตรวจบางส่วน" },
  { value: "none", label: "ยังไม่ตรวจ" },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "name_asc", label: "ชื่อ (ก-ฮ)" },
  { value: "name_desc", label: "ชื่อ (ฮ-ก)" },
  { value: "status", label: "สถานะ" },
];

const AVATAR_PALETTE = [
  "bg-blue-50 text-blue-700",
  "bg-purple-50 text-purple-700",
  "bg-green-50 text-green-700",
  "bg-orange-50 text-orange-700",
  "bg-pink-50 text-pink-700",
  "bg-teal-50 text-teal-700",
];

const BADGE_META: Record<Exclude<StatusFilter, "all">, { label: string; cls: string; action: string }> = {
  ok: { label: "ตรวจแล้ว", cls: "bg-green-50 text-green-700 border-green-200", action: "ดูผลตรวจ" },
  problem: { label: "ตรวจแล้ว", cls: "bg-green-50 text-green-700 border-green-200", action: "ดูผลตรวจ" },
  partial: { label: "ตรวจบางส่วน", cls: "bg-yellow-50 text-yellow-700 border-yellow-200", action: "ทำต่อ" },
  none: { label: "ยังไม่ตรวจ", cls: "bg-yellow-50 text-yellow-700 border-yellow-200", action: "ตรวจสอบ" },
};

const STATUS_ORDER: Record<Exclude<StatusFilter, "all">, number> = { none: 0, partial: 1, problem: 2, ok: 3 };

const PAGE_SIZES = [8, 12, 16, 24];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function formatCheckDate(v: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getUTCDate()).padStart(2, "0")}/${String(d.getUTCMonth() + 1).padStart(2, "0")}/${d.getUTCFullYear() + 543}`;
}

function toCsvValue(v: string | number | null) {
  const s = v === null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function exportCsv(rows: InspectionRow[]) {
  const header = ["ชื่อ", "ตำแหน่ง", "ฝ่าย", "สถานะ", "ทรัพย์สินทั้งหมด", "ตรวจแล้ว", "พบปัญหา", "วันที่ตรวจล่าสุด"];
  const lines = rows.map((r) => {
    const badge = badgeFor(r);
    return [
      r.name,
      r.position_name ?? "",
      r.department_name ?? "",
      BADGE_META[badge].label,
      r.total_assets,
      r.checked_assets,
      r.problem_assets,
      formatCheckDate(r.last_checked_at),
    ]
      .map(toCsvValue)
      .join(",");
  });
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "รายชื่อพนักงาน-ตรวจสอบทรัพย์สิน.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function InspectionExplorer({ rows, departments, departmentId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("name_asc");
  const [view, setView] = useState<ViewMode>("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  function updateDepartment(value: string) {
    const params = new URLSearchParams(searchParams);
    if (value) params.set("department_id", value);
    else params.delete("department_id");
    router.push(`/inspection/new${params.toString() ? `?${params}` : ""}`);
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let result = rows.filter((r) => {
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        (r.position_name ?? "").toLowerCase().includes(q);
      const matchesStatus = status === "all" || badgeFor(r) === status;
      return matchesSearch && matchesStatus;
    });

    result = [...result].sort((a, b) => {
      if (sort === "name_asc") return a.name.localeCompare(b.name, "th");
      if (sort === "name_desc") return b.name.localeCompare(a.name, "th");
      return STATUS_ORDER[badgeFor(a)] - STATUS_ORDER[badgeFor(b)];
    });

    return result;
  }, [rows, search, status, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  function resetPage() {
    setPage(1);
  }

  const pageNumbers = useMemo(() => {
    const nums: (number | "…")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || Math.abs(i - currentPage) <= 1) nums.push(i);
      else if (nums[nums.length - 1] !== "…") nums.push("…");
    }
    return nums;
  }, [totalPages, currentPage]);

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-xl p-4">
        <div className="relative flex-1 min-w-[14rem]">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              resetPage();
            }}
            placeholder="ค้นหาจากชื่อ, รหัสพนักงาน, อีเมล..."
            className="input pl-9"
            autoComplete="off"
          />
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">ฝ่าย</label>
          <select value={departmentId} onChange={(e) => updateDepartment(e.target.value)} className="input w-48">
            <option value="">ทั้งหมด</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">สถานะ</label>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value as StatusFilter);
              resetPage();
            }}
            className="input w-40"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500 whitespace-nowrap">เรียงตาม</label>
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="input w-36">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1 rounded-lg border border-gray-200 p-1">
          <button
            type="button"
            onClick={() => setView("grid")}
            aria-label="แสดงแบบตาราง"
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              view === "grid" ? "bg-[#102E5A] text-white" : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="แสดงแบบรายการ"
            className={`flex h-8 w-8 items-center justify-center rounded-md transition-colors ${
              view === "list" ? "bg-[#102E5A] text-white" : "text-gray-400 hover:bg-gray-50"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* List */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            รายชื่อพนักงาน ({filtered.length} คน)
          </h2>
          <button
            type="button"
            onClick={() => exportCsv(filtered)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#102E5A] hover:underline"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
            </svg>
            ส่งออกข้อมูล
          </button>
        </div>

        {pageRows.length === 0 ? (
          <p className="text-sm text-gray-400 py-8 text-center">ไม่พบพนักงานที่ตรงกับเงื่อนไข</p>
        ) : view === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {pageRows.map((r, i) => {
              const badge = badgeFor(r);
              const meta = BADGE_META[badge];
              const hasProblem = r.problem_assets > 0;
              const avatarCls = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
              return (
                <div key={r.id} className="flex flex-col rounded-xl border border-gray-100 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between">
                    <span className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold flex-shrink-0 ${avatarCls}`}>
                      {getInitials(r.name)}
                    </span>
                    <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 border ${meta.cls}`}>
                      {meta.label}
                    </span>
                  </div>

                  <p className="mt-3 text-sm font-semibold text-gray-900">{r.name}</p>
                  <p className="text-xs text-gray-400">{r.position_name ?? "—"}</p>

                  <div className="mt-2 text-xs text-gray-400">
                    <p>รหัสพนักงาน</p>
                    <p className="text-gray-600 font-medium">EMP-{String(r.id).padStart(4, "0")}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    {hasProblem ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        พบปัญหา {r.problem_assets} รายการ
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        ทรัพย์สิน {r.total_assets} รายการ
                      </span>
                    )}
                  </div>

                  <Link
                    href={`/inspection/new?employee_id=${r.id}`}
                    className={`mt-3 inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      badge === "ok" || badge === "problem"
                        ? "border border-[#102E5A] text-[#102E5A] hover:bg-[#102E5A]/5"
                        : "bg-[#102E5A] text-white hover:bg-[#0b2145]"
                    }`}
                  >
                    {meta.action}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col divide-y divide-gray-50">
            {pageRows.map((r, i) => {
              const badge = badgeFor(r);
              const meta = BADGE_META[badge];
              const hasProblem = r.problem_assets > 0;
              const avatarCls = AVATAR_PALETTE[i % AVATAR_PALETTE.length];
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-[1fr_auto_auto_auto] sm:grid-cols-[minmax(0,2fr)_10rem_7rem_9rem] items-center gap-4 py-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`flex items-center justify-center w-9 h-9 rounded-full text-xs font-semibold flex-shrink-0 ${avatarCls}`}>
                      {getInitials(r.name)}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">{r.name}</p>
                      <p className="text-xs text-gray-400 truncate">
                        {r.position_name ?? "—"} · EMP-{String(r.id).padStart(4, "0")}
                      </p>
                    </div>
                  </div>

                  <div className="hidden sm:block text-xs text-gray-400 whitespace-nowrap text-center">
                    {hasProblem ? (
                      <span className="text-red-600 font-medium">พบปัญหา {r.problem_assets} รายการ</span>
                    ) : (
                      <>ทรัพย์สิน {r.total_assets} รายการ</>
                    )}
                  </div>

                  <span className={`hidden sm:inline-flex items-center justify-center text-xs font-medium rounded-full px-2.5 py-1 border whitespace-nowrap ${meta.cls}`}>
                    {meta.label}
                  </span>

                  <Link
                    href={`/inspection/new?employee_id=${r.id}`}
                    className={`inline-flex items-center justify-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
                      badge === "ok" || badge === "problem"
                        ? "border border-[#102E5A] text-[#102E5A] hover:bg-[#102E5A]/5"
                        : "bg-[#102E5A] text-white hover:bg-[#0b2145]"
                    }`}
                  >
                    {meta.action}
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length > 0 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {pageNumbers.map((n, idx) =>
                n === "…" ? (
                  <span key={`e${idx}`} className="px-2 text-sm text-gray-400">…</span>
                ) : (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      n === currentPage ? "bg-[#102E5A] text-white" : "text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {n}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-400 hover:bg-gray-50 disabled:opacity-40 disabled:hover:bg-transparent"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="flex items-center gap-2 text-sm text-gray-500">
              แสดง
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  resetPage();
                }}
                className="input w-auto py-1.5"
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
              ต่อหน้า
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

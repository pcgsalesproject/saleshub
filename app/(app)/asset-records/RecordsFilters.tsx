"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import s from "./page.module.css";

interface Props {
  defaultSearch: string;
  defaultDateFrom: string;
  defaultDateTo: string;
  defaultDocType: string;
  defaultSort: string;
}

const DOC_TYPE_TABS = [
  { key: "", label: "ทั้งหมด" },
  { key: "receive", label: "รับทรัพย์สิน" },
  { key: "return", label: "คืนทรัพย์สิน" },
];

const SORT_OPTIONS = [
  { key: "doc_desc", label: "เลขที่เอกสาร (ล่าสุดก่อน)" },
  { key: "doc_asc", label: "เลขที่เอกสาร (เก่าก่อน)" },
  { key: "date_desc", label: "วันที่ (ใหม่ก่อน)" },
  { key: "date_asc", label: "วันที่ (เก่าก่อน)" },
  { key: "employee_asc", label: "พนักงาน (ก-ฮ)" },
  { key: "employee_desc", label: "พนักงาน (ฮ-ก)" },
];

export default function RecordsFilters({ defaultSearch, defaultDateFrom, defaultDateTo, defaultDocType, defaultSort }: Props) {
  const router = useRouter();
  const [search, setSearch] = useState(defaultSearch);
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo, setDateTo] = useState(defaultDateTo);
  const [searchOpen, setSearchOpen] = useState(!!defaultSearch);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);

  const currentSort = defaultSort || "doc_desc";

  function navigate(overrides: { search?: string; dateFrom?: string; dateTo?: string; docType?: string; sort?: string }) {
    const next = {
      search,
      dateFrom,
      dateTo,
      docType: defaultDocType,
      sort: currentSort,
      ...overrides,
    };
    const params = new URLSearchParams();
    if (next.search) params.set("search", next.search);
    if (next.dateFrom) params.set("dateFrom", next.dateFrom);
    if (next.dateTo) params.set("dateTo", next.dateTo);
    if (next.docType) params.set("docType", next.docType);
    if (next.sort && next.sort !== "doc_desc") params.set("sort", next.sort);
    const qs = params.toString();
    router.push(`/asset-records${qs ? `?${qs}` : ""}`);
  }

  const hasDateFilter = Boolean(defaultDateFrom || defaultDateTo);

  return (
    <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {DOC_TYPE_TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => navigate({ docType: t.key })}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              defaultDocType === t.key ? "bg-[#102E5A] text-white" : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2">
        {searchOpen ? (
          <div className={s.searchWrapInline}>
            <svg className={s.searchIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") navigate({ search });
              }}
              onBlur={() => {
                if (!search) setSearchOpen(false);
              }}
              placeholder="ค้นหาเลขที่เอกสาร, พนักงาน…"
              className={s.searchInput}
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="w-9 h-9 inline-flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-800"
            title="ค้นหา"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
            </svg>
          </button>
        )}

        <div className="relative">
          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className={`w-9 h-9 inline-flex items-center justify-center rounded-lg border hover:bg-gray-50 ${
              filterOpen || hasDateFilter ? "border-[#102E5A] text-[#102E5A]" : "border-gray-200 text-gray-500"
            }`}
            title="กรองตามวันที่"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h18M6 9h12M9 13.5h6M11 18h2" />
            </svg>
          </button>

          {filterOpen && (
            <div className="absolute right-0 top-full mt-2 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-4 w-72">
              <div className="flex flex-col gap-3">
                <div className={s.filterField}>
                  <label className={s.filterLabel}>วันที่ (จาก)</label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className={s.dateInput}
                  />
                </div>
                <div className={s.filterField}>
                  <label className={s.filterLabel}>วันที่ (ถึง)</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className={s.dateInput}
                  />
                </div>
                <div className="flex items-center gap-2 justify-end">
                  <button
                    type="button"
                    className={s.resetBtn}
                    onClick={() => {
                      setDateFrom("");
                      setDateTo("");
                      navigate({ dateFrom: "", dateTo: "" });
                      setFilterOpen(false);
                    }}
                  >
                    ล้าง
                  </button>
                  <button
                    type="button"
                    className={s.searchBtn}
                    onClick={() => {
                      navigate({ dateFrom, dateTo });
                      setFilterOpen(false);
                    }}
                  >
                    ใช้ตัวกรอง
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <button
            type="button"
            onClick={() => setSortOpen((v) => !v)}
            className={`w-9 h-9 inline-flex items-center justify-center rounded-lg border hover:bg-gray-50 ${
              sortOpen || currentSort !== "doc_desc" ? "border-[#102E5A] text-[#102E5A]" : "border-gray-200 text-gray-500"
            }`}
            title="เรียงลำดับ"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L6.5 4l3.5 3.5M6.5 4v16M21 16.5L17.5 20 14 16.5M17.5 20V4" />
            </svg>
          </button>

          {sortOpen && (
            <div className="absolute right-0 top-full mt-2 z-10 bg-white border border-gray-200 rounded-xl shadow-lg p-1.5 w-56">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    navigate({ sort: opt.key });
                    setSortOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    currentSort === opt.key ? "bg-[#102E5A] text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

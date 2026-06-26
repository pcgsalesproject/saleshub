"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import type { Department } from "@/lib/types";
import s from "./page.module.css";

interface Props {
  departments: Department[];
  defaultSearch: string;
  defaultDepartment: string;
  defaultStatus: string;
  defaultSort: string;
}

export default function EmployeeFilters({
  departments,
  defaultSearch,
  defaultDepartment,
  defaultStatus,
  defaultSort,
}: Props) {
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (value) params.set(key, String(value));
    }
    router.push(`/employees${params.toString() ? `?${params}` : ""}`);
  }

  return (
    <form className={s.filterRow} onSubmit={handleSubmit}>
      <div className={s.searchWrap}>
        <svg className={s.searchIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        <input
          name="search"
          defaultValue={defaultSearch}
          placeholder="ค้นหาชื่อ ตำแหน่ง อีเมล หรือทีม…"
          className={s.searchInput}
        />
      </div>
      <select
        name="department"
        defaultValue={defaultDepartment}
        className={s.filterSelect}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">ทุกแผนก</option>
        {departments.map((d) => (
          <option key={d.id} value={d.id}>{d.name}</option>
        ))}
      </select>
      <select
        name="status"
        defaultValue={defaultStatus}
        className={s.filterSelect}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="">ทุกสถานะ</option>
        <option value="active">Active</option>
        <option value="inactive">Inactive</option>
      </select>
      <select
        name="sort"
        defaultValue={defaultSort}
        className={s.filterSelect}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
      >
        <option value="name_asc">เรียงตามชื่อ (ก-ฮ)</option>
        <option value="name_desc">เรียงตามชื่อ (ฮ-ก)</option>
        <option value="newest">ใหม่ล่าสุด</option>
      </select>
    </form>
  );
}
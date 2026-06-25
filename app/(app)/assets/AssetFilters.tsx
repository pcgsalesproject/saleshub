"use client";

import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import type { AssetType } from "@/lib/types";
import s from "./page.module.css";

interface Props {
  assetTypes: AssetType[];
  defaultSearch: string;
  defaultType: string;
  defaultStatus: string;
}

export default function AssetFilters({ assetTypes, defaultSearch, defaultType, defaultStatus }: Props) {
  const router = useRouter();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (value) params.set(key, String(value));
    }
    router.push(`/assets${params.toString() ? `?${params}` : ""}`);
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
          placeholder="Search by asset tag, code, name, serial number, phone…"
          className={s.searchInput}
        />
      </div>

      <div className={s.filterField}>
        <label className={s.filterLabel}>Type</label>
        <select name="type" defaultValue={defaultType} className={s.filterSelect}>
          <option value="">All Types</option>
          {assetTypes.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className={s.filterField}>
        <label className={s.filterLabel}>Status</label>
        <select name="status" defaultValue={defaultStatus} className={s.filterSelect}>
          <option value="">All Status</option>
          <option value="assigned">Assigned</option>
          <option value="available">Available</option>
          <option value="repair">In Repair</option>
        </select>
      </div>

      <button type="submit" className={s.searchBtn}>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
        </svg>
        Search
      </button>
      <button
        type="button"
        className={s.resetBtn}
        onClick={() => router.push("/assets")}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
        </svg>
        Reset
      </button>
    </form>
  );
}
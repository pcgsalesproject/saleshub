"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import s from "./page.module.css";

interface KpiAsset {
  id: number;
  asset_id: number;
  asset_name: string;
  asset_type_name: string | null;
  serial_number: string | null;
  phone_number: string | null;
  assigned_at: string | null;
}

interface Props {
  tenureText: string;
  startDate: string | null;
  assets: KpiAsset[];
}

const cardReset = { width: "100%", textAlign: "left", cursor: "pointer", font: "inherit", color: "inherit" } as const;

export default function KpiCards({ tenureText, startDate, assets }: Props) {
  const [open, setOpen] = useState<"tenure" | "assets" | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <div className={s.kpiWrap}>
        <button type="button" className={s.kpiCard} style={cardReset} onClick={() => setOpen("tenure")}>
          <div className={`${s.kpiIcon} ${s.kpiIconGreen}`}>
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className={s.kpiValue}>{tenureText}</p>
            <p className={s.kpiLabel}>อายุงาน</p>
          </div>
        </button>
        <button type="button" className={s.kpiCard} style={cardReset} onClick={() => setOpen("assets")}>
          <div className={`${s.kpiIcon} ${s.kpiIconBlue}`}>
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 7.409A2.25 2.25 0 012.25 5.493V5.25" />
            </svg>
          </div>
          <div>
            <p className={s.kpiValue}>{assets.length}</p>
            <p className={s.kpiLabel}>ทรัพย์สินที่ถือครอง</p>
          </div>
        </button>
      </div>

      {open && (
        <div
          onClick={() => setOpen(null)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "0.75rem", width: "100%", maxWidth: "28rem", maxHeight: "80vh", overflowY: "auto", padding: "1.25rem", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontWeight: 600, fontSize: "1rem" }}>
                {open === "tenure" ? "อายุงาน" : `ทรัพย์สินที่ถือครอง (${assets.length})`}
              </h3>
              <button type="button" onClick={() => setOpen(null)} aria-label="ปิด" style={{ border: "none", background: "none", cursor: "pointer", fontSize: "1.25rem", color: "#9ca3af" }}>
                ×
              </button>
            </div>

            {open === "tenure" ? (
              <div className={s.fieldRow}>
                <span className={s.fieldRowLabel}>วันเริ่มงาน</span>
                <span className={s.fieldRowValue}>{startDate ?? "—"}</span>
              </div>
            ) : assets.length === 0 ? (
              <p className={s.assetEmpty}>ไม่มีทรัพย์สินที่ถือครองอยู่</p>
            ) : (
              <div className={s.assetList}>
                {assets.map((a) => (
                  <div key={a.id} className={s.assetItem}>
                    <div className={s.assetInfo}>
                      <Link href={`/assets/${a.asset_id}`} className="hover:text-[#102E5A] hover:underline">
                        <p className={s.assetName}>{a.asset_name}</p>
                      </Link>
                      <p className={s.assetCode}>Type: {a.asset_type_name ?? "—"}</p>
                      <p className={s.assetCode}>Serial Number: {a.serial_number ?? "—"}</p>
                      <p className={s.assetCode}>หมายเลข: {a.phone_number ?? "—"}</p>
                    </div>
                    <span className={s.assetDate}>รับ {a.assigned_at ?? "—"}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

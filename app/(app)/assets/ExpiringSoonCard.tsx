"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExpiringAsset } from "./page";
import s from "./page.module.css";

function formatDate(v: string) {
  const d = new Date(v);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export default function ExpiringSoonCard({
  value,
  assets,
}: {
  value: number;
  assets: ExpiringAsset[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className={s.kpiCard}>
        <div className={s.kpiTop}>
          <span className={s.kpiTitle}>Expiring Soon (30 Days)</span>
          <div className={`${s.kpiIcon} ${s.kpiIconOrange}`}>
            <svg fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        <button
          type="button"
          className={s.kpiValueBtn}
          onClick={() => setOpen(true)}
          disabled={value === 0}
        >
          {value.toLocaleString()}
        </button>
        <p className={s.kpiSub}>Warranty expires soon</p>
      </div>

      {open && (
        <div className={s.modalOverlay} onClick={() => setOpen(false)}>
          <div className={s.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHeader}>
              <span className={s.modalTitle}>ทรัพย์สินที่ใกล้หมดประกัน (30 วัน)</span>
              <button type="button" className={s.modalClose} onClick={() => setOpen(false)}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={s.modalBody}>
              {assets.length === 0 ? (
                <p className={s.empty}>ไม่มีทรัพย์สินที่ใกล้หมดประกัน</p>
              ) : (
                <table className={s.table}>
                  <thead>
                    <tr>
                      <th>Asset Tag</th>
                      <th>ชื่อทรัพย์สิน</th>
                      <th>ผู้ถือครอง</th>
                      <th>วันหมดประกัน</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assets.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <Link href={`/assets/${a.id}`} className={s.assetCodeLink}>
                            {a.asset_tag}
                          </Link>
                        </td>
                        <td>{a.asset_name}</td>
                        <td>{a.employee_name || "—"}</td>
                        <td>{formatDate(a.warranty_expiry)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

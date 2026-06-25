"use client";

import { useState } from "react";
import s from "./page.module.css";

export default function CopyableField({ label, value }: { label: string; value?: string | null }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!value) return;
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className={s.fieldRow}>
      <span className={s.fieldRowLabel}>{label}</span>
      <span className={s.fieldRowValue} style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem" }}>
        {value || "—"}
        {value && (
          <button
            type="button"
            onClick={handleCopy}
            title="คัดลอก"
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "1.25rem", height: "1.25rem", border: "none", background: "none", cursor: "pointer", color: copied ? "#16a34a" : "#9ca3af" }}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="9" y="9" width="11" height="11" rx="1.5" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15H4.5A1.5 1.5 0 013 13.5v-9A1.5 1.5 0 014.5 3h9A1.5 1.5 0 0115 4.5V5" />
              </svg>
            )}
          </button>
        )}
      </span>
    </div>
  );
}

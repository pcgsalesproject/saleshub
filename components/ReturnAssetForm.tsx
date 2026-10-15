"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { FormActionState } from "@/lib/actions/assets";

interface Props {
  action: (prevState: FormActionState | undefined, formData: FormData) => Promise<FormActionState>;
  employeeName: string;
  assetName: string;
  assetTypeName: string | null;
  serialNumber: string | null;
}

export default function ReturnAssetForm({ action, employeeName, assetName, assetTypeName, serialNumber }: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !pending) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, pending]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 rounded px-2.5 py-1 ml-3 transition-colors"
      >
        คืนทรัพย์สิน
      </button>

      {open && createPortal(
        <div
          onClick={() => !pending && setOpen(false)}
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-asset-title"
            onClick={(e) => e.stopPropagation()}
            style={{ background: "#fff", borderRadius: "0.75rem", width: "100%", maxWidth: "26rem", padding: "1.25rem", boxShadow: "0 10px 30px rgba(0,0,0,0.2)", textAlign: "left" }}
          >
            <h3 id="return-asset-title" style={{ fontWeight: 600, fontSize: "1rem", marginBottom: "0.5rem" }}>
              ยืนยันการคืนทรัพย์สิน
            </h3>
            <p className="text-sm text-gray-600" style={{ marginBottom: "1rem" }}>
              ทรัพย์สินที่เลือกจะถูกบันทึกว่าคืนแล้ว และจะถูกนำออกจากรายการทรัพย์สินที่พนักงานถือครองอยู่ในปัจจุบัน
              (ประวัติการใช้งานยังคงอยู่)
            </p>

            <dl className="text-sm" style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "0.375rem 1rem", marginBottom: "1.25rem" }}>
              <dt className="text-gray-400">พนักงาน</dt>
              <dd className="text-gray-800">{employeeName || "—"}</dd>
              <dt className="text-gray-400">ทรัพย์สิน</dt>
              <dd className="text-gray-800">{assetName}</dd>
              <dt className="text-gray-400">ประเภท</dt>
              <dd className="text-gray-800">{assetTypeName ?? "—"}</dd>
              <dt className="text-gray-400">Serial Number</dt>
              <dd className="text-gray-800">{serialNumber ?? "—"}</dd>
            </dl>

            {state?.error && <p className="text-sm text-red-600" style={{ marginBottom: "0.75rem" }}>{state.error}</p>}

            <form action={formAction} style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
              <button
                type="submit"
                disabled={pending}
                className="text-sm text-white bg-red-600 hover:bg-red-700 rounded px-3 py-1.5 disabled:opacity-60 inline-flex items-center gap-2"
              >
                {pending && (
                  <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" d="M12 3a9 9 0 019 9" />
                  </svg>
                )}
                {pending ? "กำลังคืนทรัพย์สิน..." : "ยืนยันคืนทรัพย์สิน"}
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={pending}
                className="text-sm text-gray-600 border border-gray-200 hover:border-gray-400 rounded px-3 py-1.5 disabled:opacity-50"
              >
                ยกเลิก
              </button>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

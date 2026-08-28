"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("App route error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-600">
          <svg className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.29 3.86L1.82 18a2.25 2.25 0 001.93 3.38h16.5A2.25 2.25 0 0022.18 18L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-900">ไม่สามารถโหลดข้อมูลได้</h2>
        <p className="mt-2 text-sm text-gray-500">
          ระบบอาจเชื่อมต่อฐานข้อมูลหรือบริการภายนอกไม่ได้ชั่วคราว กรุณาลองใหม่อีกครั้ง
        </p>
        {error.digest && (
          <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400">Error ID: {error.digest}</p>
        )}
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <button type="button" onClick={unstable_retry} className="btn-primary justify-center">
            ลองใหม่
          </button>
          <Link href="/dashboard" className="btn-secondary justify-center">
            กลับ Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

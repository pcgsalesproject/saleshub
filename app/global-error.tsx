"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error("Global route error:", error);
  }, [error]);

  return (
    <html lang="th">
      <body>
        <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
          <div className="w-full max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
            <h1 className="text-xl font-semibold text-gray-900">ระบบขัดข้องชั่วคราว</h1>
            <p className="mt-2 text-sm text-gray-500">
              กรุณาลองใหม่อีกครั้ง หากยังพบปัญหาให้แจ้งผู้ดูแลระบบพร้อม Error ID
            </p>
            {error.digest && (
              <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-xs text-gray-400">Error ID: {error.digest}</p>
            )}
            <button type="button" onClick={unstable_retry} className="btn-primary mt-6">
              ลองใหม่
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}

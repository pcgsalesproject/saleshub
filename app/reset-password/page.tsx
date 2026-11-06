"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/login/actions";

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState(resetPassword, null);

  return (
    <div className="min-h-screen bg-[#102E5A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-xl">
        <h1 className="text-lg font-semibold text-gray-900 mb-5">ตั้งรหัสผ่านใหม่</h1>
        <form action={action} className="space-y-4">
          <input name="password" type="password" required minLength={8} className="input w-full" placeholder="รหัสผ่านใหม่" autoComplete="new-password" />
          <input name="confirm" type="password" required minLength={8} className="input w-full" placeholder="ยืนยันรหัสผ่านใหม่" autoComplete="new-password" />
          {state?.error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{state.error}</p>
          )}
          <button type="submit" disabled={pending} className="btn-primary w-full px-8 py-3 disabled:opacity-60">
            {pending ? "กำลังบันทึก…" : "บันทึกรหัสผ่าน"}
          </button>
        </form>
      </div>
    </div>
  );
}

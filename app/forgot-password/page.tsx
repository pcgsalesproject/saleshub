"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset } from "@/app/login/actions";

export default function ForgotPasswordPage() {
  const [state, action, pending] = useActionState(requestPasswordReset, null);

  return (
    <div className="min-h-screen bg-[#102E5A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-xl">
        <h1 className="text-lg font-semibold text-gray-900">ลืมรหัสผ่าน</h1>
        <p className="mt-1 mb-5 text-sm text-gray-500">ระบบจะส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลของบัญชีนี้</p>
        {state?.sent ? (
          <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
            หากมีบัญชีนี้อยู่ ระบบได้ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลแล้ว
          </p>
        ) : (
          <form action={action} className="space-y-4">
            <input name="username" required className="input w-full" placeholder="Username" autoComplete="username" />
            <button type="submit" disabled={pending} className="btn-primary w-full px-8 py-3 disabled:opacity-60">
              {pending ? "กำลังส่ง…" : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
            </button>
          </form>
        )}
        <Link href="/login" className="mt-5 block text-center text-sm text-[#102E5A] hover:underline">กลับไปเข้าสู่ระบบ</Link>
      </div>
    </div>
  );
}

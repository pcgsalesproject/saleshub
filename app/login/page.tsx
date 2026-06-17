"use client";

import Image from "next/image";
import { useActionState } from "react";
import { login } from "./actions";

export default function LoginPage() {
  const [state, action, pending] = useActionState(login, null);

  return (
    <div className="min-h-screen bg-[#102E5A] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-2xl px-8 pb-8 pt-4 shadow-xl">
          <div className="flex flex-col items-center mb-1.5">
            <Image
              src="/logo.png"
              alt="Saleshub"
              width={200}
              height={100}
              className="object-contain"
              priority
              unoptimized
            />
          </div>

          <form action={action} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                name="email"
                type="email"
                autoComplete="email"
                required
                className="input w-full"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Password
              </label>
              <input
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="input w-full"
                placeholder="••••••••"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                name="remember"
                type="checkbox"
                className="w-4 h-4 accent-[#102E5A] cursor-pointer"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer">
                จดจำฉันไว้
              </label>
            </div>

            {state?.error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {state.error}
              </p>
            )}

            <div className="flex justify-center">
            <button
              type="submit"
              disabled={pending}
              className="btn-primary px-8 py-3 mt-2 disabled:opacity-60"
            >
              {pending ? "กำลังเข้าสู่ระบบ…" : "เข้าสู่ระบบ"}
            </button>
            </div>
          </form>
        </div>

        <p className="text-center text-xs text-white/30 mt-6">© 2026 PCG Sales Hub</p>
      </div>
    </div>
  );
}

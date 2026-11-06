"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { MENU_OPTIONS } from "@/lib/menu-config";

type Role = "admin" | "viewer";
type Action = (prev: unknown, formData: FormData) => Promise<{ error: string } | null>;

const ROLE_OPTIONS: { value: Role; label: string }[] = [
  { value: "admin", label: "Admin — จัดการระบบและใช้ได้ทุกเมนู" },
  { value: "viewer", label: "Viewer — ดูข้อมูลตามเมนูที่เลือก" },
];

const MENU_ICONS: Record<string, string> = {
  sales_admin: "M15 19.1a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12 8.1a6 6 0 0 0-4.5-5.8M16 3.2a4 4 0 0 1 0 7.6",
  employees: "M15 19.1a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12 8.1a6 6 0 0 0-4.5-5.8M16 3.2a4 4 0 0 1 0 7.6",
  assets: "M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5",
  assignments: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2M9 5h6m-6 7h6m-6 4h4",
  asset_history: "M3 12a9 9 0 1 0 3-6.7L3 8m0-5v5h5m4-1v5l3 2",
  inspection: "m21 21-4.3-4.3M17 10.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0Z",
};

function Icon({ d, className = "h-6 w-6" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  );
}

interface UserFormProps {
  action: Action;
  submitLabel: string;
  initial?: { username: string; email: string; role: Role; menu_keys: string[] };
}

export default function UserForm({ action, submitLabel, initial }: UserFormProps) {
  const [state, formAction, pending] = useActionState(action, null);
  const editing = Boolean(initial);
  const [role, setRole] = useState<Role>(initial?.role ?? "viewer");
  const [selected, setSelected] = useState<string[]>(initial?.menu_keys ?? MENU_OPTIONS.map((m) => m.key));
  const isAdmin = role === "admin";

  function toggle(key: string) {
    setSelected((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  return (
    <form action={formAction} className="rounded-2xl border border-gray-200 bg-white p-4 sm:p-6">
      <div className="mb-4 flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-3 font-semibold text-gray-900">
        <Icon d="M12 16v-4m0-4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" className="h-5 w-5" />
        ข้อมูลผู้ใช้
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Username <span className="text-red-500">*</span>
          <input
            name="username"
            required
            defaultValue={initial?.username}
            autoComplete="off"
            pattern="[a-zA-Z0-9._\-]{3,32}"
            title="a-z 0-9 . _ - ยาว 3-32 ตัวอักษร"
            className="input mt-1 w-full"
            placeholder="username"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          อีเมล (สำหรับรีเซ็ตรหัสผ่าน) <span className="text-red-500">*</span>
          <input
            name="email"
            type="email"
            required
            readOnly={editing}
            defaultValue={initial?.email}
            className={`input mt-1 w-full ${editing ? "bg-gray-50 text-gray-500" : ""}`}
            placeholder="name@example.com"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          {editing ? "รหัสผ่านใหม่" : "รหัสผ่าน"} {!editing && <span className="text-red-500">*</span>}
          <input
            name="password"
            type="password"
            required={!editing}
            minLength={8}
            autoComplete="new-password"
            className="input mt-1 w-full"
            placeholder={editing ? "เว้นว่างถ้าไม่เปลี่ยน" : "อย่างน้อย 8 ตัวอักษร"}
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          ยืนยันรหัสผ่าน {!editing && <span className="text-red-500">*</span>}
          <input
            name="confirm"
            type="password"
            required={!editing}
            minLength={8}
            autoComplete="new-password"
            className="input mt-1 w-full"
            placeholder="พิมพ์รหัสผ่านอีกครั้ง"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700 sm:col-span-2">
          สิทธิ์ผู้ใช้ (Role) <span className="text-red-500">*</span>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
            className="input mt-1 w-full"
          >
            {ROLE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </label>
      </div>

      <div className="mb-3 mt-6 rounded-lg bg-blue-50 px-4 py-3">
        <p className="flex items-center gap-2 font-semibold text-gray-900">
          <Icon d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" className="h-5 w-5" />
          เมนูที่ใช้งานได้
        </p>
        <p className="mt-1 text-xs text-gray-600">
          {isAdmin ? "Admin ใช้ได้ทุกเมนูเสมอ" : "กำหนดเมนูที่ผู้ใช้นี้สามารถเข้าถึงได้"}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {MENU_OPTIONS.map((menu) => {
          const checked = isAdmin || selected.includes(menu.key);
          return (
            <label
              key={menu.key}
              className={`flex items-center gap-3 rounded-lg border border-gray-200 p-3 ${isAdmin ? "opacity-70" : "cursor-pointer hover:bg-gray-50"}`}
            >
              <input
                type="checkbox"
                name="menu_keys"
                value={menu.key}
                checked={checked}
                disabled={isAdmin}
                onChange={() => toggle(menu.key)}
                className="h-5 w-5 accent-[#102E5A]"
              />
              <Icon d={MENU_ICONS[menu.key]} className="h-7 w-7 shrink-0 text-gray-800" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-gray-900">{menu.label}</span>
                <span className="block text-xs text-gray-500">{menu.description}</span>
              </span>
            </label>
          );
        })}
      </div>
      {/* Disabled checkboxes are not submitted, so Admin sends every menu explicitly. */}
      {isAdmin && MENU_OPTIONS.map((m) => <input key={m.key} type="hidden" name="menu_keys" value={m.key} />)}

      {state?.error && (
        <p className="mt-4 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-600">{state.error}</p>
      )}

      <div className="mt-6 flex gap-3 border-t border-gray-100 pt-5">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-[#102E5A] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#173d73] disabled:opacity-60"
        >
          {pending ? "กำลังบันทึก…" : submitLabel}
        </button>
        <Link href="/settings/users" className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
          ยกเลิก
        </Link>
      </div>
    </form>
  );
}

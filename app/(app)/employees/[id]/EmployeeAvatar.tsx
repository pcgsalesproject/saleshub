"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { uploadEmployeePhoto } from "@/lib/actions/employees";
import s from "./page.module.css";

interface Props {
  employeeId: number;
  photoUrl: string | null;
  initials: string;
}

export default function EmployeeAvatar({ employeeId, photoUrl, initials }: Props) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPending(true);
    setError(null);
    const formData = new FormData();
    formData.set("photo", file);
    const result = await uploadEmployeePhoto(employeeId, formData);
    setPending(false);
    e.target.value = "";

    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className={s.avatar} style={photoUrl ? { backgroundImage: `url(${photoUrl})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
          {!photoUrl && initials}
        </div>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={pending}
          className="absolute bottom-0 right-0 flex items-center justify-center w-9 h-9 rounded-full bg-white border border-gray-200 shadow-sm hover:bg-gray-50 disabled:opacity-50 transition-colors"
          title="อัปโหลดรูปภาพ"
        >
          {pending ? (
            <svg className="w-4 h-4 animate-spin text-gray-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 7.5L12 3m0 0L7.5 7.5M12 3v13.5" />
            </svg>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      {error && <p className="text-xs text-red-600 mt-2 text-center max-w-[10rem]">{error}</p>}
    </div>
  );
}

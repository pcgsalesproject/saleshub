"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function TagLookup() {
  const router = useRouter();
  const [tag, setTag] = useState("");

  function go() {
    const trimmed = tag.trim();
    if (!trimmed) return;
    router.push(`/assets/check/${encodeURIComponent(trimmed)}`);
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-6 max-w-md">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-1">
        <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
        ค้นหาทรัพย์สินด้วยรหัส
      </h2>
      <p className="text-xs text-gray-400 mb-4">
        สแกน QR ด้วยกล้องมือถือ หรือกรอก Asset Tag ด้วยตัวเอง
      </p>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && go()}
          placeholder="เช่น NB2026AB12"
          className="input flex-1"
          autoFocus
        />
        <button type="button" onClick={go} className="btn-primary">
          ไป
        </button>
      </div>
    </div>
  );
}

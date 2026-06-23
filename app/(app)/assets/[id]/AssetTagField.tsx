"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { regenerateAssetTag } from "@/lib/actions/assets";

interface Props {
  assetId: number;
  assetTag: string;
}

export default function AssetTagField({ assetId, assetTag }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegenerate() {
    if (!confirm("ต้องการสร้างรหัสทรัพย์สิน (Asset Tag) ใหม่หรือไม่? รหัสเดิมจะใช้ไม่ได้อีก")) return;
    setPending(true);
    setError(null);
    const result = await regenerateAssetTag(assetId);
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-gray-50">
      <span className="text-sm text-gray-400 whitespace-nowrap">Asset Tag</span>
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-600">{error}</span>}
        <span className="text-sm font-semibold text-gray-800">{assetTag}</span>
        <button
          type="button"
          onClick={handleRegenerate}
          disabled={pending}
          className="text-xs font-medium text-gray-500 border border-gray-200 rounded-lg px-2 py-1 hover:bg-gray-50 disabled:opacity-40 transition-colors"
          title="สร้างรหัสทรัพย์สินใหม่"
        >
          {pending ? "กำลังสร้าง…" : "↻ Regen"}
        </button>
      </div>
    </div>
  );
}

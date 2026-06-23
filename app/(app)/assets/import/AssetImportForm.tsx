"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { importAssets, type ImportResult } from "@/lib/actions/assets";

export default function AssetImportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError(null);
    setPending(true);

    try {
      const text = await file.text();
      const res = await importAssets(text);
      setResult(res);
    } catch {
      setError("เกิดข้อผิดพลาดระหว่างนำเข้าไฟล์ กรุณาลองใหม่");
    }
    setPending(false);
    e.target.value = "";
  }

  return (
    <div className="flex flex-col gap-4">

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          อัปโหลดไฟล์ CSV
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          คอลัมน์ที่รองรับ: asset_type_id, asset_code, asset_name, brand, model, serial_number, purchase_date, warranty_conditions
          (ไม่ต้องมี asset_tag — ระบบจะสร้างให้อัตโนมัติ)
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending ? "กำลังนำเข้า…" : "เลือกไฟล์ CSV"}
          </button>
          {fileName && <span className="text-sm text-gray-500">{fileName}</span>}
        </div>
        <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFileChange} className="hidden" />
      </div>

      {error && (
        <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            ผลการนำเข้า
          </h2>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p className="text-xl font-semibold text-gray-800">{result.totalRows}</p>
              <p className="text-xs text-gray-400">แถวทั้งหมดในไฟล์</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p className="text-xl font-semibold text-gray-500">{result.blankSkipped}</p>
              <p className="text-xs text-gray-400">แถวว่าง (ข้าม)</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p className="text-xl font-semibold text-yellow-600">{result.mergedDuplicates}</p>
              <p className="text-xs text-gray-400">serial ซ้ำ (รวมแล้ว)</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <p className="text-xl font-semibold text-green-700">{result.inserted}</p>
              <p className="text-xs text-gray-400">นำเข้าสำเร็จ</p>
            </div>
          </div>

          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-sm font-medium text-red-800 mb-1">ผิดพลาด {result.errors.length} แถว</p>
              <ul className="text-xs text-red-700 space-y-0.5 max-h-40 overflow-y-auto">
                {result.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          <Link href="/assets" className="btn-primary inline-flex">
            ดูรายการทรัพย์สิน
          </Link>
        </div>
      )}

    </div>
  );
}

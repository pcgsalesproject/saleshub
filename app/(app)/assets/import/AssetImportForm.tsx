"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  importAssets,
  previewAssetImport,
  type ImportPreview,
  type ImportResult,
} from "@/lib/actions/assets";

export default function AssetImportForm() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [csvText, setCsvText] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  function reset() {
    setFileName(null);
    setCsvText(null);
    setPreview(null);
    setResult(null);
    setError(null);
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    reset();
    setFileName(file.name);
    setPending(true);

    try {
      const text = await file.text();
      setCsvText(text);
      setPreview(await previewAssetImport(text));
    } catch {
      setError("อ่านไฟล์ไม่สำเร็จ กรุณาลองใหม่");
    }
    setPending(false);
    e.target.value = "";
  }

  async function handleConfirm() {
    if (!csvText) return;
    setPending(true);
    setError(null);
    try {
      setResult(await importAssets(csvText));
      setPreview(null);
      setCsvText(null);
    } catch {
      setError("เกิดข้อผิดพลาดระหว่างนำเข้าไฟล์ กรุณาลองใหม่");
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-4">

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          อัปโหลดไฟล์ CSV
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          ระบบอ่านคอลัมน์ตาม<b>ชื่อหัวคอลัมน์</b> (ลำดับคอลัมน์ไม่สำคัญ) รองรับ: asset_tag, eid, asset_name, asset_type_id
          (ใส่เป็น id, code หรือชื่อประเภทก็ได้), brand, model, serial_number, phone_number, purchase_price, po_number,
          vendor, warranty_conditions, purchase_date, warranty_expiry, status, note — ถ้าไม่มี asset_tag ระบบจะสร้างให้อัตโนมัติ
        </p>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={pending}
            className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {pending && !preview ? "กำลังตรวจไฟล์…" : "เลือกไฟล์ CSV"}
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

      {preview && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            ตัวอย่างก่อนนำเข้า
          </h2>

          <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3 text-xs text-gray-600">
            {preview.legacyFormat ? (
              <p className="text-yellow-700">
                ไม่พบหัวคอลัมน์ที่รู้จักในแถวแรก ระบบอ่านตามลำดับแบบเดิม (asset_type_id, eid, —, brand, model, serial_number, purchase_date, warranty_conditions)
              </p>
            ) : (
              <p>
                อ่านคอลัมน์: <span className="font-mono">{preview.columns.join(", ")}</span>
              </p>
            )}
            {preview.ignoredColumns.length > 0 && (
              <p className="mt-1 text-yellow-700">
                ไม่รู้จักและข้ามไป: <span className="font-mono">{preview.ignoredColumns.join(", ")}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-4">
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p className="text-xl font-semibold text-gray-800">{preview.totalRows}</p>
              <p className="text-xs text-gray-400">แถวทั้งหมดในไฟล์</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p className="text-xl font-semibold text-gray-500">{preview.blankSkipped}</p>
              <p className="text-xs text-gray-400">แถวว่าง (ข้าม)</p>
            </div>
            <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
              <p className="text-xl font-semibold text-yellow-600">{preview.mergedDuplicates}</p>
              <p className="text-xs text-gray-400">serial ซ้ำ (รวมแล้ว)</p>
            </div>
            <div className="bg-green-50 border border-green-100 rounded-lg p-3">
              <p className="text-xl font-semibold text-green-700">{preview.readyCount}</p>
              <p className="text-xs text-gray-400">พร้อมนำเข้า</p>
            </div>
            <div className={`rounded-lg p-3 border ${preview.errorCount ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"}`}>
              <p className={`text-xl font-semibold ${preview.errorCount ? "text-red-700" : "text-gray-500"}`}>{preview.errorCount}</p>
              <p className="text-xs text-gray-400">มีปัญหา (จะไม่ถูกนำเข้า)</p>
            </div>
          </div>

          {preview.rows.length > 0 && (
            <div className="overflow-x-auto border border-gray-100 rounded-lg mb-4 max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-50">
                  <tr className="text-left text-xs font-medium text-gray-400">
                    <th className="px-3 py-2">แถว</th>
                    <th className="px-3 py-2">ประเภท</th>
                    <th className="px-3 py-2">Asset Tag</th>
                    <th className="px-3 py-2">ชื่อทรัพย์สิน</th>
                    <th className="px-3 py-2">ยี่ห้อ</th>
                    <th className="px-3 py-2">รุ่น</th>
                    <th className="px-3 py-2">Serial Number</th>
                    <th className="px-3 py-2">EID</th>
                    <th className="px-3 py-2">วันที่ซื้อ</th>
                    <th className="px-3 py-2">รับประกัน</th>
                    <th className="px-3 py-2">ผลตรวจ</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.rows.map((r) => (
                    <tr key={r.line} className={`border-t border-gray-50 align-top ${r.errors.length ? "bg-red-50/50" : ""}`}>
                      <td className="px-3 py-2 text-xs text-gray-400">{r.line}</td>
                      <td className="px-3 py-2">{r.type_name ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.asset_tag ?? "สร้างอัตโนมัติ"}</td>
                      <td className="px-3 py-2">{r.asset_name ?? ([r.brand, r.model].filter(Boolean).join(" ") || "—")}</td>
                      <td className="px-3 py-2">{r.brand ?? "—"}</td>
                      <td className="px-3 py-2">{r.model ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs">{r.serial_number ?? "—"}</td>
                      <td className="px-3 py-2 font-mono text-xs break-all">{r.eid ?? "—"}</td>
                      <td className="px-3 py-2">{r.purchase_date ?? "—"}</td>
                      <td className="px-3 py-2">{r.warranty_conditions ?? "—"}</td>
                      <td className="px-3 py-2 text-xs">
                        {r.errors.length === 0 && r.warnings.length === 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 font-medium text-green-700">
                            พร้อม
                          </span>
                        )}
                        {r.errors.map((m) => (
                          <p key={m} className="text-red-700">{m}</p>
                        ))}
                        {r.warnings.map((m) => (
                          <p key={m} className="text-yellow-700">{m}</p>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {preview.truncated && (
            <p className="text-xs text-gray-400 mb-4">แสดง {preview.rows.length} แถวแรก แถวที่เหลือจะถูกตรวจและนำเข้าเหมือนกัน</p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={pending || preview.readyCount === 0}
              className="btn-primary disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {pending ? "กำลังนำเข้า…" : `ยืนยันนำเข้า ${preview.readyCount} รายการ`}
            </button>
            <button
              type="button"
              onClick={reset}
              disabled={pending}
              className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40"
            >
              ยกเลิก
            </button>
          </div>
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

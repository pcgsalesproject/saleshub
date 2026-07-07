"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { acknowledgeAssets } from "@/lib/actions/assets";
import { ACKNOWLEDGED_BY } from "@/lib/acknowledge";
import AcknowledgePdf from "./AcknowledgePdf";
import EmployeePicker from "./EmployeePicker";

interface Employee {
  id: number;
  employee_id: string | null;
  name: string;
  department_name: string | null;
  position_name: string | null;
}

interface Asset {
  id: number;
  asset_tag: string;
  asset_name: string;
  asset_type_id: number | null;
  asset_type_name: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  phone_number: string | null;
}

interface AssetType {
  id: number;
  name: string;
}

interface Props {
  employees: Employee[];
  assets: Asset[];
  assetTypes: AssetType[];
  previewDocNumber: string;
}

export default function AcknowledgeForm({ employees, assets, assetTypes, previewDocNumber }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const [assetTypeId, setAssetTypeId] = useState("");
  const [assetSelectValue, setAssetSelectValue] = useState("");
  const [selectedAssets, setSelectedAssets] = useState<Asset[]>([]);

  const [assignedAt, setAssignedAt] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");

  const [proposedBy, setProposedBy] = useState<Employee | null>(null);
  const [endorsedBy, setEndorsedBy] = useState<Employee | null>(null);
  const [approvedBy, setApprovedBy] = useState<Employee | null>(null);

  const filteredAssets = !assetTypeId ? [] : assets.filter((a) => {
    if (selectedAssets.some((s) => s.id === a.id)) return false;
    return String(a.asset_type_id) === assetTypeId;
  });

  function addAsset(asset: Asset) {
    setSelectedAssets((prev) => [...prev, asset]);
    setAssetSelectValue("");
  }

  function removeAsset(id: number) {
    setSelectedAssets((prev) => prev.filter((a) => a.id !== id));
  }

  async function handleSubmit() {
    setError(null);

    if (!selectedEmployee) {
      setError("กรุณาเลือกพนักงาน");
      return;
    }
    if (selectedAssets.length === 0) {
      setError("กรุณาเลือกทรัพย์สินอย่างน้อย 1 รายการ");
      return;
    }

    startTransition(async () => {
      try {
        const result = await acknowledgeAssets(
          selectedEmployee.id,
          selectedAssets.map((a) => a.id),
          assignedAt,
          note || null,
          proposedBy?.id ?? null,
          endorsedBy?.id ?? null,
          approvedBy?.id ?? null
        );

        if (!result.ok) {
          setError(result.error);
          return;
        }
        const docNumber = result.docNumber;

        const blob = await pdf(
          <AcknowledgePdf
            employee={selectedEmployee}
            assets={selectedAssets}
            assignedAt={assignedAt}
            docNumber={docNumber}
            proposedBy={proposedBy}
            endorsedBy={endorsedBy}
            approvedBy={approvedBy}
            acknowledgedBy={ACKNOWLEDGED_BY}
          />
        ).toBlob();

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `รับทรัพย์สิน-${selectedEmployee.employee_id}-${assignedAt}.pdf`;
        a.click();
        URL.revokeObjectURL(url);

        router.push("/asset-history");
      } catch (err) {
        setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด ไม่สามารถบันทึกได้");
      }
    });
  }

  return (
    <div className="space-y-5">
      {/* Date / document number / recipient */}
      <div className="grid grid-cols-1 sm:grid-cols-[2fr_2fr_5fr] gap-3" style={{ maxWidth: 700 }}>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">เลขที่เอกสาร</label>
          <input
            type="text"
            value={previewDocNumber}
            readOnly
            className="input-readonly w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่รับทรัพย์สิน</label>
          <input
            type="date"
            value={assignedAt}
            onChange={(e) => setAssignedAt(e.target.value)}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            ผู้รับทรัพย์สิน <span className="text-red-500">*</span>
          </label>
          <EmployeePicker employees={employees} value={selectedEmployee} onChange={setSelectedEmployee} />
        </div>
      </div>

      {/* Asset search + table */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          รายการทรัพย์สินที่ได้รับ <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_3fr] gap-3" style={{ maxWidth: 700 }}>
          <div>
            <label className="block text-xs text-gray-500 mb-1">ประเภท</label>
            <select
              value={assetTypeId}
              onChange={(e) => { setAssetTypeId(e.target.value); setAssetSelectValue(""); }}
              className="input w-full"
            >
              <option value="">เลือกประเภท</option>
              {assetTypes.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">ชื่อทรัพย์สิน</label>
            <select
              value={assetSelectValue}
              onChange={(e) => {
                const asset = filteredAssets.find((a) => String(a.id) === e.target.value);
                if (asset) addAsset(asset);
              }}
              disabled={!assetTypeId}
              className="input w-full disabled:opacity-60"
            >
              <option value="">
                {!assetTypeId
                  ? "เลือกประเภทก่อน"
                  : filteredAssets.length > 0
                  ? "เลือกทรัพย์สิน"
                  : "ไม่มีทรัพย์สินว่างในประเภทนี้"}
              </option>
              {filteredAssets.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.asset_name} — {a.asset_tag}{a.serial_number ? ` · ${a.serial_number}` : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedAssets.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2 w-10">#</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">รายการทรัพย์สิน</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">ยี่ห้อ/รุ่น</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">Serial Number</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">หมายเลข</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {selectedAssets.map((a, i) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 text-gray-800">{a.asset_type_name ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{[a.brand, a.model].filter(Boolean).join(" ") || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{a.serial_number ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600 font-mono">{a.phone_number ?? "-"}</td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeAsset(a.id)}
                        className="text-gray-400 hover:text-red-600"
                        title="ลบ"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Note */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">หมายเหตุ</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="หมายเหตุเพิ่มเติม (ถ้ามี)"
          className="input"
        />
      </div>

      {/* Approval block — printed on PDF only, not saved to database */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">ลงนามเอกสาร</label>
        <p className="text-xs text-gray-400 mb-2">ข้อมูลในส่วนนี้ใช้แสดงในเอกสาร PDF เท่านั้น ไม่ถูกบันทึกลงระบบ</p>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">เสนอ</label>
            <EmployeePicker employees={employees} value={proposedBy} onChange={setProposedBy} placeholder="ค้นหาชื่อ..." />
            <div className="input-readonly w-full mt-2 text-center text-gray-500">
              {proposedBy?.position_name ?? "ตำแหน่ง"}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">เห็นชอบ</label>
            <EmployeePicker employees={employees} value={endorsedBy} onChange={setEndorsedBy} placeholder="ค้นหาชื่อ..." />
            <div className="input-readonly w-full mt-2 text-center text-gray-500">
              {endorsedBy?.position_name ?? "ตำแหน่ง"}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">อนุมัติ</label>
            <EmployeePicker employees={employees} value={approvedBy} onChange={setApprovedBy} placeholder="ค้นหาชื่อ..." />
            <div className="input-readonly w-full mt-2 text-center text-gray-500">
              {approvedBy?.position_name ?? "ตำแหน่ง"}
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">รับทราบ</label>
            <div className="input-readonly w-full text-center">{ACKNOWLEDGED_BY.name}</div>
            <div className="input-readonly w-full mt-2 text-center text-gray-500">
              {ACKNOWLEDGED_BY.position_name}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-3 pt-1">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="btn-primary disabled:opacity-60"
        >
          {isPending ? "กำลังบันทึก…" : "บันทึกและออกเอกสาร"}
        </button>
      </div>
    </div>
  );
}

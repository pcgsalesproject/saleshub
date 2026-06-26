"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import { returnAssets } from "@/lib/actions/assets";
import { ACKNOWLEDGED_BY } from "@/lib/acknowledge";
import AcknowledgeReturnPdf from "./AcknowledgeReturnPdf";
import EmployeePicker from "./EmployeePicker";

interface Employee {
  id: number;
  employee_id: string | null;
  name: string;
  department_name: string | null;
  position_name: string | null;
}

interface Assignment {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  asset_type_name: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  phone_number: string | null;
  employee_id: number;
}

interface SelectedReturn extends Assignment {
  condition: "ดี" | "ชำรุด";
}

interface Props {
  employees: Employee[];
  assignments: Assignment[];
  previewDocNumber: string;
}

export default function ReturnForm({ employees, assignments, previewDocNumber }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [assignmentSelectValue, setAssignmentSelectValue] = useState("");
  const [selectedReturns, setSelectedReturns] = useState<SelectedReturn[]>([]);

  const [returnedAt, setReturnedAt] = useState(new Date().toISOString().slice(0, 10));

  const [proposedBy, setProposedBy] = useState<Employee | null>(null);
  const [endorsedBy, setEndorsedBy] = useState<Employee | null>(null);
  const [approvedBy, setApprovedBy] = useState<Employee | null>(null);

  const availableAssignments = !selectedEmployee ? [] : assignments.filter((a) => {
    if (a.employee_id !== selectedEmployee.id) return false;
    return !selectedReturns.some((s) => s.id === a.id);
  });

  function addAssignment(assignment: Assignment) {
    setSelectedReturns((prev) => [...prev, { ...assignment, condition: "ดี" }]);
    setAssignmentSelectValue("");
  }

  function removeAssignment(id: number) {
    setSelectedReturns((prev) => prev.filter((a) => a.id !== id));
  }

  function setCondition(id: number, condition: "ดี" | "ชำรุด") {
    setSelectedReturns((prev) => prev.map((a) => (a.id === id ? { ...a, condition } : a)));
  }

  async function handleSubmit() {
    setError(null);

    if (!selectedEmployee) {
      setError("กรุณาเลือกพนักงาน");
      return;
    }
    if (selectedReturns.length === 0) {
      setError("กรุณาเลือกทรัพย์สินอย่างน้อย 1 รายการ");
      return;
    }

    startTransition(async () => {
      try {
        const docNumber = await returnAssets(
          selectedReturns.map((a) => ({ assignmentId: a.id, condition: a.condition })),
          returnedAt,
          proposedBy?.id ?? null,
          endorsedBy?.id ?? null,
          approvedBy?.id ?? null
        );

        const blob = await pdf(
          <AcknowledgeReturnPdf
            employee={selectedEmployee}
            assets={selectedReturns.map((a) => ({
              asset_name: a.asset_name,
              asset_type_name: a.asset_type_name,
              brand: a.brand,
              model: a.model,
              serial_number: a.serial_number,
              phone_number: a.phone_number,
              asset_tag: a.asset_tag,
              condition: a.condition,
            }))}
            returnedAt={returnedAt}
            docNumber={docNumber}
            proposedBy={proposedBy}
            endorsedBy={endorsedBy}
            approvedBy={approvedBy}
            receivedBy={ACKNOWLEDGED_BY}
          />
        ).toBlob();

        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `คืนทรัพย์สิน-${selectedEmployee.employee_id}-${returnedAt}.pdf`;
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
      {/* Date / document number / returning employee */}
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">วันที่คืนทรัพย์สิน</label>
          <input
            type="date"
            value={returnedAt}
            onChange={(e) => setReturnedAt(e.target.value)}
            className="input w-full"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            ผู้คืนทรัพย์สิน <span className="text-red-500">*</span>
          </label>
          <EmployeePicker
            employees={employees}
            value={selectedEmployee}
            onChange={(e) => { setSelectedEmployee(e); setSelectedReturns([]); }}
          />
        </div>
      </div>

      {/* Asset selection + table */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          รายการทรัพย์สินที่ส่งคืน <span className="text-red-500">*</span>
        </label>

        <div style={{ maxWidth: 700 }}>
          <select
            value={assignmentSelectValue}
            onChange={(e) => {
              const assignment = availableAssignments.find((a) => String(a.id) === e.target.value);
              if (assignment) addAssignment(assignment);
            }}
            disabled={!selectedEmployee}
            className="input w-full disabled:opacity-60"
          >
            <option value="">
              {!selectedEmployee
                ? "เลือกพนักงานก่อน"
                : availableAssignments.length > 0
                ? "เลือกทรัพย์สิน"
                : "พนักงานนี้ไม่มีทรัพย์สินที่ถือครองอยู่"}
            </option>
            {availableAssignments.map((a) => (
              <option key={a.id} value={a.id}>
                {a.asset_name} — {a.asset_tag}{a.serial_number ? ` · ${a.serial_number}` : ""}
              </option>
            ))}
          </select>
        </div>

        {selectedReturns.length > 0 && (
          <div className="mt-3 border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2 w-10">#</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">รายการทรัพย์สิน</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">ยี่ห้อ/รุ่น</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">Serial Number</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2">หมายเลข</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-3 py-2 w-28">สภาพ</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {selectedReturns.map((a, i) => (
                  <tr key={a.id} className="border-b border-gray-50 last:border-0">
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 text-gray-800">{a.asset_type_name ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{[a.brand, a.model].filter(Boolean).join(" ") || "—"}</td>
                    <td className="px-3 py-2 text-gray-600">{a.serial_number ?? "—"}</td>
                    <td className="px-3 py-2 text-gray-600 font-mono">{a.phone_number ?? "-"}</td>
                    <td className="px-3 py-2">
                      <select
                        value={a.condition}
                        onChange={(e) => setCondition(a.id, e.target.value as "ดี" | "ชำรุด")}
                        className="input w-full"
                      >
                        <option value="ดี">ดี</option>
                        <option value="ชำรุด">ชำรุด</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <button
                        type="button"
                        onClick={() => removeAssignment(a.id)}
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

      {/* Approval block — printed on PDF only, not saved to database */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">ลงนามเอกสาร</label>
        <p className="text-xs text-gray-400 mb-2">ข้อมูลในส่วนนี้ใช้แสดงในเอกสาร PDF เท่านั้น</p>
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

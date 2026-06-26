"use client";

import Link from "next/link";
import type { Employee, Department, Position, SalesArea, EmployeeOption } from "@/lib/types";
import SubmitButton from "@/components/SubmitButton";

interface Props {
  action: (formData: FormData) => Promise<void>;
  departments: Department[];
  positions: Position[];
  salesAreas: SalesArea[];
  managers: EmployeeOption[];
  employee?: Employee;
}

const PREFIX_TH_OPTIONS = ["นาย", "นาง", "นางสาว"];
const PREFIX_EN_OPTIONS = ["Mr.", "Mrs.", "Miss", "Ms."];

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <span className="text-sm font-semibold text-[#102E5A] uppercase tracking-wide whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-gray-200" />
    </div>
  );
}

function Label({ text, required }: { text: string; required?: boolean }) {
  return (
    <label className="block text-sm font-medium text-gray-700 mb-1.5">
      {text}{required && <span className="text-red-500 ml-0.5">*</span>}
    </label>
  );
}

const inputCls = "input";

export default function EmployeeForm({ action, departments, positions, salesAreas, managers, employee }: Props) {
  return (
    <form action={action} className="space-y-8">

      {/* ════════════════ ข้อมูลพนักงาน ════════════════ */}
      <section>
        <SectionTitle>ข้อมูลพนักงาน</SectionTitle>

        {/* Row 1 — รหัสพนักงาน + วันที่เริ่มงาน + สถานะ + วันที่ลาออก */}
        <div className="grid grid-cols-4 gap-5 mb-5">
          <div>
            <Label text="รหัสพนักงาน" required />
            <input
              name="employee_id"
              required
              defaultValue={employee?.employee_id}
              placeholder="เช่น EMP001"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="วันที่เริ่มงาน" />
            <input
              type="date"
              name="start_date"
              defaultValue={employee?.start_date ? new Date(employee.start_date).toISOString().slice(0, 10) : ""}
              className={inputCls}
            />
          </div>
          <div>
            <Label text="สถานะ" />
            <div className="flex gap-5 mt-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  value="true"
                  defaultChecked={employee?.is_active !== false}
                  className="accent-[#102E5A] w-4 h-4"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="is_active"
                  value="false"
                  defaultChecked={employee?.is_active === false}
                  className="accent-[#102E5A] w-4 h-4"
                />
                <span className="text-sm text-gray-700">Inactive</span>
              </label>
            </div>
          </div>
          <div>
            <Label text="วันที่ลาออก" />
            <input
              type="date"
              name="resigned_at"
              defaultValue={employee?.resigned_at ? new Date(employee.resigned_at).toISOString().slice(0, 10) : ""}
              className={inputCls}
            />
          </div>
        </div>

        {/* Row 2 — คำนำหน้า (TH) | ชื่อ | นามสกุล */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div>
            <Label text="คำนำหน้าชื่อ" />
            <select
              name="prefix_th"
              defaultValue={employee?.prefix_th ?? ""}
              className={inputCls}
            >
              <option value="">— เลือก —</option>
              {PREFIX_TH_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <Label text="ชื่อ" required />
            <input
              name="first_name"
              required
              defaultValue={employee?.first_name}
              placeholder="ชื่อจริง"
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <Label text="นามสกุล" required />
            <input
              name="last_name"
              required
              defaultValue={employee?.last_name}
              placeholder="นามสกุล"
              className={inputCls}
            />
          </div>
        </div>

        {/* Row 3 — Prefix (EN) | First Name | Last Name */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label text="Prefix" />
            <select
              name="prefix_en"
              defaultValue={employee?.prefix_en ?? ""}
              className={inputCls}
            >
              <option value="">— Select —</option>
              {PREFIX_EN_OPTIONS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <Label text="First Name" />
            <input
              name="first_name_en"
              defaultValue={employee?.first_name_en ?? ""}
              placeholder="First name"
              className={inputCls}
            />
          </div>
          <div className="col-span-2">
            <Label text="Last Name" />
            <input
              name="last_name_en"
              defaultValue={employee?.last_name_en ?? ""}
              placeholder="Last name"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ════════════════ ข้อมูลส่วนตัว ════════════════ */}
      <section>
        <SectionTitle>ข้อมูลส่วนตัว</SectionTitle>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label text="วัน / เดือน / ปีเกิด" />
            <input
              type="date"
              name="date_of_birth"
              defaultValue={employee?.date_of_birth ? new Date(employee.date_of_birth).toISOString().slice(0, 10) : ""}
              className={inputCls}
            />
          </div>
          <div>
            <Label text="เลขบัตรประชาชน" />
            <input
              name="national_id"
              defaultValue={employee?.national_id ?? ""}
              maxLength={13}
              placeholder="x-xxxx-xxxxx-xx-x"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="เพศ" />
            <select
              name="gender"
              defaultValue={employee?.gender ?? ""}
              className={inputCls}
            >
              <option value="">— เลือก —</option>
              <option value="male">ชาย</option>
              <option value="female">หญิง</option>
            </select>
          </div>
          <div>
            <Label text="เบอร์โทรศัพท์" />
            <input
              name="phone"
              type="tel"
              defaultValue={employee?.phone ?? ""}
              placeholder="0xx-xxx-xxxx"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="อีเมล" />
            <input
              name="email"
              type="email"
              defaultValue={employee?.email ?? ""}
              placeholder="example@company.com"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ════════════════ ข้อมูลการทำงาน ════════════════ */}
      <section>
        <SectionTitle>ข้อมูลการทำงาน</SectionTitle>
        <div className="grid grid-cols-2 gap-5">
          <div>
            <Label text="ฝ่าย" />
            <select
              name="department_id"
              defaultValue={employee?.department_id ?? ""}
              className={inputCls}
            >
              <option value="">— เลือกฝ่าย —</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label text="ตำแหน่ง" />
            <select
              name="position_id"
              defaultValue={employee?.position_id ?? ""}
              className={inputCls}
            >
              <option value="">— เลือกตำแหน่ง —</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>{p.position}</option>
              ))}
            </select>
          </div>
          <div>
            <Label text="เขตการขาย" />
            <select
              name="sales_area_id"
              defaultValue={employee?.sales_area_id ?? ""}
              className={inputCls}
            >
              <option value="">— เลือกเขต —</option>
              {salesAreas.map((sa) => (
                <option key={sa.id} value={sa.id}>{sa.name}</option>
              ))}
            </select>
          </div>
          <div>
            <Label text="ผู้บังคับบัญชา" />
            <select
              name="manager_id"
              defaultValue={employee?.manager_id ?? ""}
              className={inputCls}
            >
              <option value="">— ไม่มี —</option>
              {managers.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* ════════════════ Actions ════════════════ */}
      <div className="flex items-center justify-end gap-3 pt-1 border-t border-gray-100">
        <SubmitButton
          label={employee ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มพนักงาน"}
          pendingLabel="กำลังบันทึก…"
        />
        <Link
          href="/employees/information"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ยกเลิก
        </Link>
      </div>

    </form>
  );
}

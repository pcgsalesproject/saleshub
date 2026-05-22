"use client";

import { useState } from "react";
import Link from "next/link";
import type { Employee, Department, Position } from "@/lib/types";
import SubmitButton from "@/components/SubmitButton";

interface Props {
  action: (formData: FormData) => Promise<void>;
  departments: Department[];
  positions: Position[];
  employee?: Employee;
}

const TITLE_TH_OPTIONS = ["นาย", "นาง", "นางสาว"];
const PREFIX_EN_OPTIONS = ["Mr.", "Mrs.", "Miss", "Ms."];
const STATUS_OPTIONS = [
  { value: "Active",   label: "Active" },
  { value: "Inactive", label: "Inactive" },
] as const;

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

export default function EmployeeForm({ action, departments, positions, employee }: Props) {
  const [firstName,  setFirstName]  = useState(employee?.first_name   ?? "");
  const [lastName,   setLastName]   = useState(employee?.last_name    ?? "");
  const [fullNameTh, setFullNameTh] = useState(
    employee?.full_name ?? [employee?.first_name, employee?.last_name].filter(Boolean).join(" ")
  );

  const [firstNameEn, setFirstNameEn] = useState(employee?.first_name_en ?? "");
  const [lastNameEn,  setLastNameEn]  = useState(employee?.last_name_en  ?? "");
  const [fullNameEn,  setFullNameEn]  = useState(
    employee?.full_name_en ?? [employee?.first_name_en, employee?.last_name_en].filter(Boolean).join(" ")
  );

  return (
    <form action={action} className="space-y-8">

      {/* ════════════════ ข้อมูลพนักงาน ════════════════ */}
      <section>
        <SectionTitle>ข้อมูลพนักงาน</SectionTitle>

        {/* Row 1 — รหัสพนักงาน + สถานะ */}
        <div className="grid grid-cols-2 gap-5 mb-5">
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
            <Label text="สถานะ" />
            <div className="flex gap-5 mt-3">
              {STATUS_OPTIONS.map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="status"
                    value={opt.value}
                    defaultChecked={(employee?.status ?? "Active") === opt.value}
                    className="accent-[#102E5A] w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Row 2 — คำนำหน้า | ชื่อ | นามสกุล | ชื่อ-นามสกุล */}
        <div className="grid grid-cols-4 gap-4 mb-5">
          <div>
            <Label text="คำนำหน้าชื่อ" />
            <select
              name="title_th"
              defaultValue={employee?.title_th ?? ""}
              className={inputCls}
            >
              <option value="">— เลือก —</option>
              {TITLE_TH_OPTIONS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <Label text="ชื่อ" required />
            <input
              name="first_name"
              required
              value={firstName}
              onChange={(e) => {
                setFirstName(e.target.value);
                setFullNameTh([e.target.value, lastName].filter(Boolean).join(" "));
              }}
              placeholder="ชื่อจริง"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="นามสกุล" required />
            <input
              name="last_name"
              required
              value={lastName}
              onChange={(e) => {
                setLastName(e.target.value);
                setFullNameTh([firstName, e.target.value].filter(Boolean).join(" "));
              }}
              placeholder="นามสกุล"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="ชื่อ-นามสกุล" />
            <input
              name="full_name"
              value={fullNameTh}
              onChange={(e) => setFullNameTh(e.target.value)}
              placeholder="auto"
              className={inputCls}
            />
          </div>
        </div>

        {/* Row 3 — Prefix | First Name | Last Name | Full Name */}
        <div className="grid grid-cols-4 gap-4">
          <div>
            <Label text="Prefix" />
            <select
              name="prefix"
              defaultValue={employee?.prefix ?? ""}
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
              value={firstNameEn}
              onChange={(e) => {
                setFirstNameEn(e.target.value);
                setFullNameEn([e.target.value, lastNameEn].filter(Boolean).join(" "));
              }}
              placeholder="First name"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="Last Name" />
            <input
              name="last_name_en"
              value={lastNameEn}
              onChange={(e) => {
                setLastNameEn(e.target.value);
                setFullNameEn([firstNameEn, e.target.value].filter(Boolean).join(" "));
              }}
              placeholder="Last name"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="Full Name" />
            <input
              name="full_name_en"
              value={fullNameEn}
              onChange={(e) => setFullNameEn(e.target.value)}
              placeholder="auto"
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
            <Label text="วัน / เดือน / ปีเกิด" />
            <input
              type="date"
              name="date_of_birth"
              defaultValue={employee?.date_of_birth?.slice(0, 10)}
              className={inputCls}
            />
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
            <input
              name="sales_zone"
              defaultValue={employee?.sales_zone ?? ""}
              placeholder="เช่น เขตภาคเหนือ"
              className={inputCls}
            />
          </div>
          <div>
            <Label text="จังหวัดที่ดูแล" />
            <input
              name="provinces"
              defaultValue={employee?.provinces ?? ""}
              placeholder="เช่น เชียงใหม่, ลำพูน, ลำปาง"
              className={inputCls}
            />
          </div>
        </div>
      </section>

      {/* ════════════════ Actions ════════════════ */}
      <div className="flex items-center gap-3 pt-1 border-t border-gray-100">
        <SubmitButton
          label={employee ? "บันทึกการเปลี่ยนแปลง" : "เพิ่มพนักงาน"}
          pendingLabel="กำลังบันทึก…"
        />
        <Link
          href="/employees"
          className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          ยกเลิก
        </Link>
      </div>

    </form>
  );
}

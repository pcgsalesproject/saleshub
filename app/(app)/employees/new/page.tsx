import pool from "@/lib/db";
import type { Department, Position } from "@/lib/types";
import Header from "@/components/Header";
import EmployeeForm from "../EmployeeForm";
import { createEmployee } from "@/lib/actions/employees";

async function getData(): Promise<{ departments: Department[]; positions: Position[] }> {
  const [[deptRows], [posRows]] = await Promise.all([
    pool.execute("SELECT id, name FROM departments ORDER BY name"),
    pool.execute("SELECT id, position FROM positions ORDER BY position"),
  ]);
  return {
    departments: deptRows as Department[],
    positions:   posRows  as Position[],
  };
}

export default async function NewEmployeePage() {
  const { departments, positions } = await getData();

  return (
    <div>
      <Header title="เพิ่มพนักงาน" subtitle="กรอกข้อมูลพนักงานใหม่" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <EmployeeForm action={createEmployee} departments={departments} positions={positions} />
      </div>
    </div>
  );
}

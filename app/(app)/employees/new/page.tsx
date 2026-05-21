import pool from "@/lib/db";
import type { Department } from "@/lib/types";
import Header from "@/components/Header";
import EmployeeForm from "../EmployeeForm";
import { createEmployee } from "@/lib/actions/employees";

async function getDepartments(): Promise<Department[]> {
  const [rows] = await pool.execute("SELECT id, name FROM departments ORDER BY name");
  return rows as Department[];
}

export default async function NewEmployeePage() {
  const departments = await getDepartments();

  return (
    <div>
      <Header title="Add Employee" subtitle="Fill in the details below" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <EmployeeForm action={createEmployee} departments={departments} />
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import pool from "@/lib/db";
import type { Employee, Department } from "@/lib/types";
import Header from "@/components/Header";
import EmployeeForm from "../../EmployeeForm";
import { updateEmployee } from "@/lib/actions/employees";

async function getEmployee(id: number): Promise<Employee | null> {
  const [rows] = await pool.execute(
    `SELECT e.*, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.id
     WHERE e.id = ?`,
    [id]
  );
  const list = rows as Employee[];
  return list[0] ?? null;
}

async function getDepartments(): Promise<Department[]> {
  const [rows] = await pool.execute("SELECT id, name FROM departments ORDER BY name");
  return rows as Department[];
}

export default async function EditEmployeePage(props: PageProps<"/employees/[id]/edit">) {
  const { id } = await props.params;
  const numId = Number(id);
  const [employee, departments] = await Promise.all([getEmployee(numId), getDepartments()]);

  if (!employee) notFound();

  const action = updateEmployee.bind(null, numId);

  return (
    <div>
      <Header
        title="Edit Employee"
        subtitle={`${employee.first_name} ${employee.last_name} — ${employee.employee_id}`}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <EmployeeForm action={action} departments={departments} employee={employee} />
      </div>
    </div>
  );
}

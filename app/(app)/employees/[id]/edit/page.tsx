import { notFound } from "next/navigation";
import pool from "@/lib/db";
import type { Employee, Department, Position } from "@/lib/types";
import Header from "@/components/Header";
import EmployeeForm from "../../EmployeeForm";
import { updateEmployee } from "@/lib/actions/employees";

async function getEmployee(id: number): Promise<Employee | null> {
  const [rows] = await pool.execute(
    `SELECT e.*, d.name AS department_name, p.position AS position_name
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.id
     LEFT JOIN positions   p ON e.position_id   = p.id
     WHERE e.id = ?`,
    [id]
  );
  const list = rows as Employee[];
  return list[0] ?? null;
}

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

export default async function EditEmployeePage(props: PageProps<"/employees/[id]/edit">) {
  const { id } = await props.params;
  const numId = Number(id);
  const [employee, { departments, positions }] = await Promise.all([
    getEmployee(numId),
    getData(),
  ]);

  if (!employee) notFound();

  const action = updateEmployee.bind(null, numId);

  return (
    <div>
      <Header
        title="แก้ไขข้อมูลพนักงาน"
        subtitle={`${employee.full_name ?? `${employee.first_name} ${employee.last_name}`} — ${employee.employee_id}`}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <EmployeeForm
          action={action}
          departments={departments}
          positions={positions}
          employee={employee}
        />
      </div>
    </div>
  );
}

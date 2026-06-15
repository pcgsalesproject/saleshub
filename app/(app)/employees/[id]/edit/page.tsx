import { notFound } from "next/navigation";
import sql from "@/lib/db";
import type { Employee, Department, Position, SalesArea } from "@/lib/types";
import Header from "@/components/Header";
import EmployeeForm from "../../EmployeeForm";
import { updateEmployee } from "@/lib/actions/employees";

async function getEmployee(id: number): Promise<Employee | null> {
  const rows = await sql<Employee[]>`
    SELECT e.*, d.name AS department_name, p.position AS position_name,
           sa.name AS sales_area_name
    FROM   employees e
    LEFT JOIN departments d  ON e.department_id = d.id
    LEFT JOIN positions   p  ON e.position_id   = p.id
    LEFT JOIN sales_areas sa ON e.sales_area_id = sa.id
    WHERE e.id = ${id}
  `;
  return rows[0] ?? null;
}

async function getData(): Promise<{ departments: Department[]; positions: Position[]; salesAreas: SalesArea[] }> {
  const [departments, positions, salesAreas] = await Promise.all([
    sql<Department[]>`SELECT id, name FROM departments ORDER BY name`,
    sql<Position[]>`SELECT id, position FROM positions ORDER BY position`,
    sql<SalesArea[]>`SELECT id, name FROM sales_areas ORDER BY name`,
  ]);
  return { departments, positions, salesAreas };
}

export default async function EditEmployeePage(props: PageProps<"/employees/[id]/edit">) {
  const { id } = await props.params;
  const numId = Number(id);
  const [employee, { departments, positions, salesAreas }] = await Promise.all([
    getEmployee(numId),
    getData(),
  ]);

  if (!employee) notFound();

  const action = updateEmployee.bind(null, numId);

  return (
    <div>
      <Header
        title="แก้ไขข้อมูลพนักงาน"
        subtitle={`${[employee.prefix_th, employee.first_name, employee.last_name].filter(Boolean).join(" ")} — ${employee.employee_id}`}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <EmployeeForm
          action={action}
          departments={departments}
          positions={positions}
          salesAreas={salesAreas}
          employee={employee}
        />
      </div>
    </div>
  );
}

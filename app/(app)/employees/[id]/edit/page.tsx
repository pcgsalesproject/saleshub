import { notFound, redirect } from "next/navigation";
import sql from "@/lib/db";
import type { Employee, Department, Position, SalesArea, EmployeeOption } from "@/lib/types";
import Header from "@/components/Header";
import EmployeeForm from "../../EmployeeForm";
import DeleteButton from "../../DeleteButton";
import { updateEmployee } from "@/lib/actions/employees";
import { getCurrentRole } from "@/lib/roles";

async function getEmployee(id: number): Promise<Employee | null> {
  const rows = await sql<Employee[]>`
    SELECT e.*, d.name AS department_name, p.position AS position_name,
           sa.area_name AS sales_area_name
    FROM   employees e
    LEFT JOIN departments d  ON e.department_id = d.id
    LEFT JOIN positions   p  ON e.position_id   = p.id
    LEFT JOIN sales_areas sa ON e.sales_area_id = sa.id
    WHERE e.id = ${id}
  `;
  return rows[0] ?? null;
}

async function getData(excludeId: number): Promise<{ departments: Department[]; positions: Position[]; salesAreas: SalesArea[]; managers: EmployeeOption[] }> {
  const [departments, positions, salesAreas, managers] = await Promise.all([
    sql<Department[]>`SELECT id, name FROM departments ORDER BY name`,
    sql<Position[]>`SELECT id, position FROM positions ORDER BY position`,
    sql<SalesArea[]>`SELECT id, area_name AS name FROM sales_areas ORDER BY area_name`,
    sql<EmployeeOption[]>`SELECT id, TRIM(CONCAT(prefix_th, ' ', first_name, ' ', last_name)) AS name FROM employees WHERE position_id IN (8, 9, 10, 11) AND id != ${excludeId} ORDER BY first_name`,
  ]);
  return { departments, positions, salesAreas, managers };
}

export default async function EditEmployeePage(props: PageProps<"/employees/[id]/edit">) {
  const { id } = await props.params;
  const numId = Number(id);

  const role = await getCurrentRole();
  if (role !== "admin") redirect(`/employees/${numId}`);

  const [employee, { departments, positions, salesAreas, managers }] = await Promise.all([
    getEmployee(numId),
    getData(numId),
  ]);

  if (!employee) notFound();

  const action = updateEmployee.bind(null, numId);

  return (
    <div>
      <Header
        title="แก้ไขข้อมูลพนักงาน"
        subtitle={`${[employee.prefix_th, employee.first_name, employee.last_name].filter(Boolean).join(" ")} — ${employee.employee_id}`}
        actions={<DeleteButton id={numId} name={[employee.prefix_th, employee.first_name, employee.last_name].filter(Boolean).join(" ")} />}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <EmployeeForm
          action={action}
          departments={departments}
          positions={positions}
          salesAreas={salesAreas}
          managers={managers}
          employee={employee}
        />
      </div>
    </div>
  );
}

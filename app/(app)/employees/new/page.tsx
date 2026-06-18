import sql from "@/lib/db";
import type { Department, Position, SalesArea, EmployeeOption } from "@/lib/types";
import Header from "@/components/Header";
import EmployeeForm from "../EmployeeForm";
import { createEmployee } from "@/lib/actions/employees";

async function getData(): Promise<{ departments: Department[]; positions: Position[]; salesAreas: SalesArea[]; managers: EmployeeOption[] }> {
  const [departments, positions, salesAreas, managers] = await Promise.all([
    sql<Department[]>`SELECT id, name FROM departments ORDER BY name`,
    sql<Position[]>`SELECT id, position FROM positions ORDER BY position`,
    sql<SalesArea[]>`SELECT id, area_name AS name FROM sales_areas ORDER BY area_name`,
    sql<EmployeeOption[]>`SELECT id, TRIM(CONCAT(prefix_th, ' ', first_name, ' ', last_name)) AS name FROM employees ORDER BY first_name`,
  ]);
  return { departments, positions, salesAreas, managers };
}

export default async function NewEmployeePage() {
  const { departments, positions, salesAreas, managers } = await getData();

  return (
    <div>
      <Header title="เพิ่มพนักงาน" subtitle="กรอกข้อมูลพนักงานใหม่" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <EmployeeForm
          action={createEmployee}
          departments={departments}
          positions={positions}
          salesAreas={salesAreas}
          managers={managers}
        />
      </div>
    </div>
  );
}

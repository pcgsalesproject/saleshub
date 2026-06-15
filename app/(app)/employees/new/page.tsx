import sql from "@/lib/db";
import type { Department, Position, SalesArea } from "@/lib/types";
import Header from "@/components/Header";
import EmployeeForm from "../EmployeeForm";
import { createEmployee } from "@/lib/actions/employees";

async function getData(): Promise<{ departments: Department[]; positions: Position[]; salesAreas: SalesArea[] }> {
  const [departments, positions, salesAreas] = await Promise.all([
    sql<Department[]>`SELECT id, name FROM departments ORDER BY name`,
    sql<Position[]>`SELECT id, position FROM positions ORDER BY position`,
    sql<SalesArea[]>`SELECT id, name FROM sales_areas ORDER BY name`,
  ]);
  return { departments, positions, salesAreas };
}

export default async function NewEmployeePage() {
  const { departments, positions, salesAreas } = await getData();

  return (
    <div>
      <Header title="เพิ่มพนักงาน" subtitle="กรอกข้อมูลพนักงานใหม่" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <EmployeeForm
          action={createEmployee}
          departments={departments}
          positions={positions}
          salesAreas={salesAreas}
        />
      </div>
    </div>
  );
}

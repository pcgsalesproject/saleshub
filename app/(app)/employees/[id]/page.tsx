import Link from "next/link";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import type { Employee } from "@/lib/types";
import Header from "@/components/Header";
import DeleteButton from "../DeleteButton";

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

export default async function EmployeeDetailPage(props: PageProps<"/employees/[id]">) {
  const { id } = await props.params;
  const employee = await getEmployee(Number(id));

  if (!employee) notFound();

  const fullName = [employee.prefix_th, employee.first_name, employee.last_name].filter(Boolean).join(" ");

  const fields: { label: string; value: string | null | undefined }[] = [
    { label: "รหัสพนักงาน", value: employee.employee_id },
    { label: "ชื่อ-นามสกุล", value: fullName },
    { label: "อีเมล", value: employee.email },
    { label: "เบอร์โทร", value: employee.phone },
    { label: "ฝ่าย", value: employee.department_name },
    { label: "ตำแหน่ง", value: employee.position_name },
    { label: "เขตการขาย", value: employee.sales_area_name },
    { label: "สถานะ", value: employee.is_active ? "Active" : "Inactive" },
  ];

  return (
    <div>
      <Header
        title={fullName}
        subtitle={employee.employee_id}
        actions={
          <div className="flex items-center gap-2">
            <Link href="/employees" className="btn-outline">
              ย้อนกลับ
            </Link>
            <Link href={`/employees/${employee.id}/edit`} className="btn-outline">
              แก้ไข
            </Link>
            <DeleteButton id={employee.id} name={fullName} />
          </div>
        }
      />

      <div className="rounded-xl border border-gray-200 bg-white divide-y divide-gray-100">
        {fields.map(({ label, value }) => (
          <div key={label} className="flex px-6 py-4 gap-4">
            <span className="w-40 shrink-0 text-sm text-gray-500">{label}</span>
            <span className="text-sm text-gray-900">{value ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

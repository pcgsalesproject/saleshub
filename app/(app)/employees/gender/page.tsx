import Header from "@/components/Header";
import SubmitButton from "@/components/SubmitButton";
import sql from "@/lib/db";
import { bulkUpdateGender } from "@/lib/actions/employees";
import s from "./page.module.css";

interface Row {
  id: number;
  employee_id: string;
  first_name: string;
  last_name: string;
  department_name: string | null;
}

async function getEmployeesMissingGender(): Promise<Row[]> {
  return sql<Row[]>`
    SELECT e.id, e.employee_id, e.first_name, e.last_name, d.name AS department_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.is_active AND e.gender IS NULL
    ORDER BY e.first_name, e.last_name
  `;
}

export default async function EmployeeGenderPage() {
  const rows = await getEmployeesMissingGender();

  return (
    <div>
      <Header
        title="กรอกข้อมูลเพศพนักงาน"
        subtitle={`พนักงานที่ยังไม่มีข้อมูลเพศ ${rows.length} คน`}
      />

      {rows.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">ข้อมูลเพศครบทุกคนแล้ว</p>
      ) : (
        <form action={bulkUpdateGender}>
          <div className={s.tableWrap}>
            <table className={s.table}>
              <thead>
                <tr>
                  <th>รหัสพนักงาน</th>
                  <th>ชื่อ-นามสกุล</th>
                  <th>แผนก</th>
                  <th>เพศ</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.employee_id}</td>
                    <td>{emp.first_name} {emp.last_name}</td>
                    <td>{emp.department_name ?? "—"}</td>
                    <td>
                      <select name={`gender_${emp.id}`} defaultValue="" className={`input ${s.select}`}>
                        <option value="">— เลือก —</option>
                        <option value="male">ชาย</option>
                        <option value="female">หญิง</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-4 flex justify-end">
            <SubmitButton label="บันทึกทั้งหมด" pendingLabel="กำลังบันทึก…" />
          </div>
        </form>
      )}
    </div>
  );
}

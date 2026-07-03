import Link from "next/link";
import Header from "@/components/Header";
import EmployeeStats from "./EmployeeStats";

export default function EmployeesPage() {
  return (
    <div>
      <Header
        title="พนักงาน"
        subtitle="ภาพรวมข้อมูลพนักงาน"
        actions={
          <Link href="/employees/gender" className="btn-secondary">
            กรอกข้อมูลเพศที่ขาด
          </Link>
        }
      />

      <EmployeeStats />
    </div>
  );
}

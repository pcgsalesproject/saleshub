import Link from "next/link";
import { getCurrentRole } from "@/lib/roles";
import Header from "@/components/Header";
import EmployeeStats from "./EmployeeStats";

export default async function EmployeesPage() {
  const isAdmin = await getCurrentRole() === "admin";
  return (
    <div>
      <Header
        title="พนักงาน"
        subtitle="ภาพรวมข้อมูลพนักงาน"
        actions={isAdmin ? (
          <Link href="/employees/gender" className="btn-secondary">
            กรอกข้อมูลเพศที่ขาด
          </Link>
        ) : undefined}
      />

      <EmployeeStats />
    </div>
  );
}

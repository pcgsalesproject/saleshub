import Header from "@/components/Header";
import EmployeeStats from "./EmployeeStats";

export default function EmployeesPage() {
  return (
    <div>
      <Header
        title="พนักงาน"
        subtitle="ภาพรวมข้อมูลพนักงาน"
      />

      <EmployeeStats />
    </div>
  );
}

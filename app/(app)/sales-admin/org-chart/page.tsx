import Header from "@/components/Header";
import OrgChartBuilder from "@/components/OrgChartBuilder";
import { getOrgChartTree, getAssignableEmployees } from "@/lib/actions/org-chart";
import { getCurrentRole } from "@/lib/roles";

export default async function OrgChartPage() {
  const [root, employees, role] = await Promise.all([
    getOrgChartTree(),
    getAssignableEmployees(),
    getCurrentRole(),
  ]);

  return (
    <div>
      <Header
        title="ผังโครงสร้างองค์กร"
        subtitle={role === "admin" ? "ลากพนักงานจากรายชื่อไปวางในตำแหน่งที่ต้องการ" : "Sales Admin Department"}
      />
      {root ? (
        <OrgChartBuilder root={root} employees={employees} isAdmin={role === "admin"} />
      ) : (
        <p className="py-16 text-center text-sm text-gray-400">ยังไม่มีผังโครงสร้าง</p>
      )}
    </div>
  );
}

import { requireMenuAccess } from "@/lib/menu-access";

export default async function EmployeesLayout({ children }: { children: React.ReactNode }) {
  await requireMenuAccess("employees");
  return children;
}

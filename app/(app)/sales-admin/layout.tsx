import { requireMenuAccess } from "@/lib/menu-access";

export default async function SalesAdminLayout({ children }: { children: React.ReactNode }) {
  await requireMenuAccess("sales_admin");
  return children;
}

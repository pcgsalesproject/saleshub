import { requireMenuAccess } from "@/lib/menu-access";

export default async function InspectionLayout({ children }: { children: React.ReactNode }) {
  await requireMenuAccess("inspection");
  return children;
}

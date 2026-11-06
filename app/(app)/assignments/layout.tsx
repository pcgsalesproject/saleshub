import { requireMenuAccess } from "@/lib/menu-access";

export default async function AssignmentsLayout({ children }: { children: React.ReactNode }) {
  await requireMenuAccess("assignments");
  return children;
}

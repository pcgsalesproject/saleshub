import { requireMenuAccess } from "@/lib/menu-access";

export default async function AssetsLayout({ children }: { children: React.ReactNode }) {
  await requireMenuAccess("assets");
  return children;
}

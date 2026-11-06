import { requireMenuAccess } from "@/lib/menu-access";

export default async function AssetHistoryLayout({ children }: { children: React.ReactNode }) {
  await requireMenuAccess("asset_history");
  return children;
}

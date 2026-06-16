import sql from "@/lib/db";
import type { AssetType } from "@/lib/types";
import Header from "@/components/Header";
import AssetForm from "../AssetForm";
import { createAsset } from "@/lib/actions/assets";

async function getAssetTypes(): Promise<AssetType[]> {
  return sql<AssetType[]>`SELECT id, code, name FROM asset_types ORDER BY name`;
}

export default async function NewAssetPage() {
  const assetTypes = await getAssetTypes();

  return (
    <div>
      <Header title="เพิ่มทรัพย์สิน" subtitle="กรอกข้อมูลทรัพย์สินใหม่" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <AssetForm action={createAsset} assetTypes={assetTypes} />
      </div>
    </div>
  );
}
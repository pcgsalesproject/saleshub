import { notFound } from "next/navigation";
import sql from "@/lib/db";
import type { Asset, AssetType } from "@/lib/types";
import Header from "@/components/Header";
import AssetForm from "../../AssetForm";
import { updateAsset } from "@/lib/actions/assets";

async function getAsset(id: number): Promise<Asset | null> {
  const rows = await sql<Asset[]>`
    SELECT a.*, at.name AS asset_type_name
    FROM assets a
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    WHERE a.id = ${id}
  `;
  return rows[0] ?? null;
}

async function getAssetTypes(): Promise<AssetType[]> {
  return sql<AssetType[]>`SELECT id, code, name FROM asset_types ORDER BY name`;
}

export default async function EditAssetPage(props: PageProps<"/assets/[id]/edit">) {
  const { id } = await props.params;
  const numId = Number(id);

  const [asset, assetTypes] = await Promise.all([
    getAsset(numId),
    getAssetTypes(),
  ]);

  if (!asset) notFound();

  const action = updateAsset.bind(null, numId);

  return (
    <div>
      <Header
        title="แก้ไขทรัพย์สิน"
        subtitle={`${asset.asset_tag} — ${asset.asset_name}`}
      />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <AssetForm action={action} assetTypes={assetTypes} asset={asset} />
      </div>
    </div>
  );
}

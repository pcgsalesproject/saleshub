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

async function getCurrentHolder(assetId: number): Promise<string | null> {
  const rows = await sql<{ employee_name: string }[]>`
    SELECT TRIM(CONCAT(e.first_name, ' ', e.last_name)) AS employee_name
    FROM asset_assignments aa
    JOIN employees e ON aa.employee_id = e.id
    WHERE aa.asset_id = ${assetId} AND aa.returned_at IS NULL
    ORDER BY aa.assigned_at DESC LIMIT 1
  `;
  return rows[0]?.employee_name ?? null;
}

async function getAssetTypes(): Promise<AssetType[]> {
  return sql<AssetType[]>`SELECT id, code, name FROM asset_types ORDER BY name`;
}

export default async function EditAssetPage(props: PageProps<"/assets/[id]/edit">) {
  const { id } = await props.params;
  const numId = Number(id);

  const [asset, assetTypes, holderName] = await Promise.all([
    getAsset(numId),
    getAssetTypes(),
    getCurrentHolder(numId),
  ]);

  if (!asset) notFound();

  const action = updateAsset.bind(null, numId);

  return (
    <div>
      <Header
        title="แก้ไขทรัพย์สิน"
        subtitle={`${asset.asset_tag} — ${asset.asset_name}`}
      />
      <div>
        <AssetForm action={action} assetTypes={assetTypes} asset={asset} holderName={holderName} />
      </div>
    </div>
  );
}

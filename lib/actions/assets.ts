"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function extractFields(formData: FormData) {
  const typeRaw = formData.get("asset_type_id") as string;

  return {
    asset_tag:         formData.get("asset_tag") as string,
    asset_code:      (formData.get("asset_code") as string) || null,
    asset_name:        formData.get("asset_name") as string,
    asset_type_id:    typeRaw ? Number(typeRaw) : null,
    brand:           (formData.get("brand") as string) || null,
    model:           (formData.get("model") as string) || null,
    serial_number:        (formData.get("serial_number") as string) || null,
    purchase_price:       (formData.get("purchase_price") as string) ? Number(formData.get("purchase_price")) : null,
    po_number:            (formData.get("po_number") as string) || null,
    vendor:               (formData.get("vendor") as string) || null,
    warranty_conditions:  (formData.get("warranty_conditions") as string) || null,
    purchase_date:        (formData.get("purchase_date") as string) || null,
    warranty_expiry:      (formData.get("warranty_expiry") as string) || null,
    status:               (formData.get("status") as string) || "available",
    note:                 (formData.get("note") as string) || null,
  };
}

export async function createAsset(formData: FormData) {
  const f = extractFields(formData);

  try {
    await sql`
      INSERT INTO assets
        (asset_tag, asset_code, asset_name, asset_type_id, brand, model, serial_number,
         purchase_price, po_number, vendor, warranty_conditions,
         purchase_date, warranty_expiry, status, note)
      VALUES (
        ${f.asset_tag}, ${f.asset_code}, ${f.asset_name}, ${f.asset_type_id}, ${f.brand}, ${f.model}, ${f.serial_number},
        ${f.purchase_price}, ${f.po_number}, ${f.vendor}, ${f.warranty_conditions},
        ${f.purchase_date}, ${f.warranty_expiry}, ${f.status}, ${f.note}
      )
    `;
  } catch (error) {
    console.error("Failed to create asset:", error);
    throw new Error("ไม่สามารถเพิ่มทรัพย์สินได้ อาจมีรหัสทรัพย์สินหรือข้อมูลบางอย่างซ้ำในระบบ");
  }

  revalidatePath("/assets");
  redirect("/assets");
}

export async function assignAsset(assetId: number, formData: FormData) {
  const employeeId = Number(formData.get("employee_id"));
  const assignedAt = (formData.get("assigned_at") as string) || new Date().toISOString().slice(0, 10);
  const note = (formData.get("note") as string) || null;

  if (!employeeId) throw new Error("กรุณาเลือกพนักงาน");

  await sql`
    INSERT INTO asset_assignments (asset_id, employee_id, assigned_at, note)
    VALUES (${assetId}, ${employeeId}, ${assignedAt}, ${note})
  `;

  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

export async function returnAsset(assignmentId: number, assetId: number) {
  await sql`
    UPDATE asset_assignments SET returned_at = NOW() WHERE id = ${assignmentId}
  `;

  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

export async function returnAssetFromEmployee(assignmentId: number, employeeId: number) {
  await sql`
    UPDATE asset_assignments SET returned_at = NOW() WHERE id = ${assignmentId}
  `;

  revalidatePath(`/employees/${employeeId}`);
  redirect(`/employees/${employeeId}?tab=assignments`);
}

export async function updateAsset(id: number, formData: FormData) {
  const f = extractFields(formData);

  try {
    await sql`
      UPDATE assets SET
        asset_tag           = ${f.asset_tag},
        asset_code          = ${f.asset_code},
        asset_name          = ${f.asset_name},
        asset_type_id       = ${f.asset_type_id},
        brand               = ${f.brand},
        model               = ${f.model},
        serial_number       = ${f.serial_number},
        purchase_price      = ${f.purchase_price},
        po_number           = ${f.po_number},
        vendor              = ${f.vendor},
        warranty_conditions = ${f.warranty_conditions},
        purchase_date       = ${f.purchase_date},
        warranty_expiry     = ${f.warranty_expiry},
        status              = ${f.status},
        note                = ${f.note},
        updated_at          = NOW()
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error("Failed to update asset:", error);
    throw new Error("ไม่สามารถอัปเดตทรัพย์สินได้ อาจมีข้อมูลบางอย่างซ้ำในระบบ");
  }

  revalidatePath("/assets");
  redirect("/assets");
}
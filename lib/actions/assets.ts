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
    serial_number:   (formData.get("serial_number") as string) || null,
    purchase_date:   (formData.get("purchase_date") as string) || null,
    warranty_expiry: (formData.get("warranty_expiry") as string) || null,
    status:          (formData.get("status") as string) || "available",
    note:            (formData.get("note") as string) || null,
  };
}

export async function createAsset(formData: FormData) {
  const f = extractFields(formData);

  try {
    await sql`
      INSERT INTO assets
        (asset_tag, asset_code, asset_name, asset_type_id, brand, model, serial_number,
         purchase_date, warranty_expiry, status, note)
      VALUES (
        ${f.asset_tag}, ${f.asset_code}, ${f.asset_name}, ${f.asset_type_id}, ${f.brand}, ${f.model}, ${f.serial_number},
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
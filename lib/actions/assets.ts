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
    phone_number:         (formData.get("phone_number") as string) || null,
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
        (asset_tag, asset_code, asset_name, asset_type_id, brand, model, serial_number, phone_number,
         purchase_price, po_number, vendor, warranty_conditions,
         purchase_date, warranty_expiry, status, note)
      VALUES (
        ${f.asset_tag}, ${f.asset_code}, ${f.asset_name}, ${f.asset_type_id}, ${f.brand}, ${f.model}, ${f.serial_number}, ${f.phone_number},
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

export async function peekNextDocumentNumber(): Promise<string> {
  const buddhistYear = new Date().getFullYear() + 543;

  const rows = await sql<{ last_seq: number }[]>`
    SELECT last_seq FROM document_number_sequences WHERE year = ${buddhistYear}
  `;
  const nextSeq = (rows[0]?.last_seq ?? 0) + 1;

  return `ทส.ฝข.${String(nextSeq).padStart(3, "0")}/${buddhistYear}`;
}

export async function getNextDocumentNumber(): Promise<string> {
  const buddhistYear = new Date().getFullYear() + 543;

  const [{ last_seq }] = await sql<{ last_seq: number }[]>`
    INSERT INTO document_number_sequences (year, last_seq)
    VALUES (${buddhistYear}, 1)
    ON CONFLICT (year) DO UPDATE SET last_seq = document_number_sequences.last_seq + 1
    RETURNING last_seq
  `;

  return `ทส.ฝข.${String(last_seq).padStart(3, "0")}/${buddhistYear}`;
}

export async function acknowledgeAssets(
  employeeId: number,
  assetIds: number[],
  assignedAt: string,
  note: string | null,
  proposedById: number | null,
  endorsedById: number | null,
  approvedById: number | null
): Promise<string> {
  if (!employeeId) throw new Error("กรุณาเลือกพนักงาน");
  if (!assetIds.length) throw new Error("กรุณาเลือกทรัพย์สินอย่างน้อย 1 รายการ");

  const docNumber = await getNextDocumentNumber();

  await Promise.all(
    assetIds.map((assetId) =>
      sql`
        INSERT INTO asset_assignments
          (asset_id, employee_id, assigned_at, note, doc_number, proposed_by_id, endorsed_by_id, approved_by_id)
        VALUES (${assetId}, ${employeeId}, ${assignedAt}, ${note}, ${docNumber}, ${proposedById}, ${endorsedById}, ${approvedById})
      `
    )
  );

  revalidatePath("/assignments");
  return docNumber;
}

export async function returnAssets(
  items: { assignmentId: number; condition: string }[],
  returnedAt: string,
  proposedById: number | null,
  endorsedById: number | null,
  approvedById: number | null
): Promise<string> {
  if (!items.length) throw new Error("กรุณาเลือกทรัพย์สินอย่างน้อย 1 รายการ");

  const docNumber = await getNextDocumentNumber();

  await Promise.all(
    items.map((item) =>
      sql`
        UPDATE asset_assignments SET
          returned_at = ${returnedAt},
          condition = ${item.condition},
          return_doc_number = ${docNumber},
          return_proposed_by_id = ${proposedById},
          return_endorsed_by_id = ${endorsedById},
          return_approved_by_id = ${approvedById}
        WHERE id = ${item.assignmentId}
      `
    )
  );

  revalidatePath("/assignments");
  return docNumber;
}

interface ReprintPerson {
  name: string;
  position_name: string | null;
  department_name: string | null;
}

export interface ReprintDocument {
  docNumber: string;
  assignedAt: string;
  employee: { employee_id: string; name: string; position_name: string | null; department_name: string | null };
  assets: { asset_name: string; asset_type_name: string | null; brand: string | null; model: string | null; serial_number: string | null; phone_number: string | null; asset_tag: string }[];
  proposedBy: ReprintPerson | null;
  endorsedBy: ReprintPerson | null;
  approvedBy: ReprintPerson | null;
}

export async function getDocumentForReprint(docNumber: string): Promise<ReprintDocument> {
  const rows = await sql<{
    assigned_at: string;
    employee_id: string;
    employee_name: string;
    employee_position: string | null;
    employee_department: string | null;
    asset_name: string;
    asset_type_name: string | null;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    phone_number: string | null;
    asset_tag: string;
    proposed_by_name: string | null;
    proposed_by_position: string | null;
    proposed_by_department: string | null;
    endorsed_by_name: string | null;
    endorsed_by_position: string | null;
    endorsed_by_department: string | null;
    approved_by_name: string | null;
    approved_by_position: string | null;
    approved_by_department: string | null;
  }[]>`
    SELECT
      aa.assigned_at::date::text AS assigned_at,
      e.employee_id, TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS employee_name,
      ep.position AS employee_position, ed.name AS employee_department,
      a.asset_name, at.name AS asset_type_name, a.brand, a.model, a.serial_number, a.phone_number, a.asset_tag,
      TRIM(CONCAT(pb.prefix_th, ' ', pb.first_name, ' ', pb.last_name)) AS proposed_by_name,
      pbp.position AS proposed_by_position, pbd.name AS proposed_by_department,
      TRIM(CONCAT(eb.prefix_th, ' ', eb.first_name, ' ', eb.last_name)) AS endorsed_by_name,
      ebp.position AS endorsed_by_position, ebd.name AS endorsed_by_department,
      TRIM(CONCAT(ab.prefix_th, ' ', ab.first_name, ' ', ab.last_name)) AS approved_by_name,
      abp.position AS approved_by_position, abd.name AS approved_by_department
    FROM asset_assignments aa
    JOIN employees e ON aa.employee_id = e.id
    LEFT JOIN positions ep ON e.position_id = ep.id
    LEFT JOIN departments ed ON e.department_id = ed.id
    JOIN assets a ON aa.asset_id = a.id
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    LEFT JOIN employees pb ON aa.proposed_by_id = pb.id
    LEFT JOIN positions pbp ON pb.position_id = pbp.id
    LEFT JOIN departments pbd ON pb.department_id = pbd.id
    LEFT JOIN employees eb ON aa.endorsed_by_id = eb.id
    LEFT JOIN positions ebp ON eb.position_id = ebp.id
    LEFT JOIN departments ebd ON eb.department_id = ebd.id
    LEFT JOIN employees ab ON aa.approved_by_id = ab.id
    LEFT JOIN positions abp ON ab.position_id = abp.id
    LEFT JOIN departments abd ON ab.department_id = abd.id
    WHERE aa.doc_number = ${docNumber}
    ORDER BY aa.id
  `;

  if (!rows.length) throw new Error("ไม่พบเอกสาร");

  const first = rows[0];

  return {
    docNumber,
    assignedAt: first.assigned_at,
    employee: {
      employee_id: first.employee_id,
      name: first.employee_name,
      position_name: first.employee_position,
      department_name: first.employee_department,
    },
    assets: rows.map((r) => ({
      asset_name: r.asset_name,
      asset_type_name: r.asset_type_name,
      brand: r.brand,
      model: r.model,
      serial_number: r.serial_number,
      phone_number: r.phone_number,
      asset_tag: r.asset_tag,
    })),
    proposedBy: first.proposed_by_name
      ? { name: first.proposed_by_name, position_name: first.proposed_by_position, department_name: first.proposed_by_department }
      : null,
    endorsedBy: first.endorsed_by_name
      ? { name: first.endorsed_by_name, position_name: first.endorsed_by_position, department_name: first.endorsed_by_department }
      : null,
    approvedBy: first.approved_by_name
      ? { name: first.approved_by_name, position_name: first.approved_by_position, department_name: first.approved_by_department }
      : null,
  };
}

export interface ReprintReturnDocument {
  docNumber: string;
  returnedAt: string;
  employee: { employee_id: string; name: string; position_name: string | null; department_name: string | null };
  assets: { asset_name: string; asset_type_name: string | null; brand: string | null; model: string | null; serial_number: string | null; phone_number: string | null; asset_tag: string; condition: string }[];
  proposedBy: ReprintPerson | null;
  endorsedBy: ReprintPerson | null;
  approvedBy: ReprintPerson | null;
}

export async function getReturnDocumentForReprint(docNumber: string): Promise<ReprintReturnDocument> {
  const rows = await sql<{
    returned_at: string;
    employee_id: string;
    employee_name: string;
    employee_position: string | null;
    employee_department: string | null;
    asset_name: string;
    asset_type_name: string | null;
    brand: string | null;
    model: string | null;
    serial_number: string | null;
    phone_number: string | null;
    asset_tag: string;
    condition: string | null;
    proposed_by_name: string | null;
    proposed_by_position: string | null;
    proposed_by_department: string | null;
    endorsed_by_name: string | null;
    endorsed_by_position: string | null;
    endorsed_by_department: string | null;
    approved_by_name: string | null;
    approved_by_position: string | null;
    approved_by_department: string | null;
  }[]>`
    SELECT
      aa.returned_at::date::text AS returned_at,
      e.employee_id, TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS employee_name,
      ep.position AS employee_position, ed.name AS employee_department,
      a.asset_name, at.name AS asset_type_name, a.brand, a.model, a.serial_number, a.phone_number, a.asset_tag,
      aa.condition,
      TRIM(CONCAT(pb.prefix_th, ' ', pb.first_name, ' ', pb.last_name)) AS proposed_by_name,
      pbp.position AS proposed_by_position, pbd.name AS proposed_by_department,
      TRIM(CONCAT(eb.prefix_th, ' ', eb.first_name, ' ', eb.last_name)) AS endorsed_by_name,
      ebp.position AS endorsed_by_position, ebd.name AS endorsed_by_department,
      TRIM(CONCAT(ab.prefix_th, ' ', ab.first_name, ' ', ab.last_name)) AS approved_by_name,
      abp.position AS approved_by_position, abd.name AS approved_by_department
    FROM asset_assignments aa
    JOIN employees e ON aa.employee_id = e.id
    LEFT JOIN positions ep ON e.position_id = ep.id
    LEFT JOIN departments ed ON e.department_id = ed.id
    JOIN assets a ON aa.asset_id = a.id
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    LEFT JOIN employees pb ON aa.return_proposed_by_id = pb.id
    LEFT JOIN positions pbp ON pb.position_id = pbp.id
    LEFT JOIN departments pbd ON pb.department_id = pbd.id
    LEFT JOIN employees eb ON aa.return_endorsed_by_id = eb.id
    LEFT JOIN positions ebp ON eb.position_id = ebp.id
    LEFT JOIN departments ebd ON eb.department_id = ebd.id
    LEFT JOIN employees ab ON aa.return_approved_by_id = ab.id
    LEFT JOIN positions abp ON ab.position_id = abp.id
    LEFT JOIN departments abd ON ab.department_id = abd.id
    WHERE aa.return_doc_number = ${docNumber}
    ORDER BY aa.id
  `;

  if (!rows.length) throw new Error("ไม่พบเอกสาร");

  const first = rows[0];

  return {
    docNumber,
    returnedAt: first.returned_at,
    employee: {
      employee_id: first.employee_id,
      name: first.employee_name,
      position_name: first.employee_position,
      department_name: first.employee_department,
    },
    assets: rows.map((r) => ({
      asset_name: r.asset_name,
      asset_type_name: r.asset_type_name,
      brand: r.brand,
      model: r.model,
      serial_number: r.serial_number,
      phone_number: r.phone_number,
      asset_tag: r.asset_tag,
      condition: r.condition ?? "-",
    })),
    proposedBy: first.proposed_by_name
      ? { name: first.proposed_by_name, position_name: first.proposed_by_position, department_name: first.proposed_by_department }
      : null,
    endorsedBy: first.endorsed_by_name
      ? { name: first.endorsed_by_name, position_name: first.endorsed_by_position, department_name: first.endorsed_by_department }
      : null,
    approvedBy: first.approved_by_name
      ? { name: first.approved_by_name, position_name: first.approved_by_position, department_name: first.approved_by_department }
      : null,
  };
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
        phone_number        = ${f.phone_number},
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
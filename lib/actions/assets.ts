"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const RANDOM_TAG_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion

function randomTagSuffix(length = 4): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += RANDOM_TAG_CHARS[Math.floor(Math.random() * RANDOM_TAG_CHARS.length)];
  }
  return out;
}

async function generateUniqueAssetTag(typeId: number | null): Promise<string> {
  const prefix = `A${typeId ?? 0}`;
  for (let attempt = 0; attempt < 10; attempt++) {
    const tag = `${prefix}${randomTagSuffix()}`;
    const existing = await sql<{ id: number }[]>`SELECT id FROM assets WHERE asset_tag = ${tag} LIMIT 1`;
    if (existing.length === 0) return tag;
  }
  throw new Error("ไม่สามารถสร้างรหัสทรัพย์สินที่ไม่ซ้ำได้ กรุณาลองใหม่");
}

export async function regenerateAssetTag(assetId: number): Promise<{ ok: true; tag: string } | { ok: false; error: string }> {
  const rows = await sql<{ asset_type_id: number | null }[]>`SELECT asset_type_id FROM assets WHERE id = ${assetId}`;
  if (rows.length === 0) return { ok: false, error: "ไม่พบทรัพย์สิน" };

  try {
    const tag = await generateUniqueAssetTag(rows[0].asset_type_id);
    await sql`UPDATE assets SET asset_tag = ${tag}, updated_at = NOW() WHERE id = ${assetId}`;
    revalidatePath(`/assets/${assetId}`);
    revalidatePath("/assets");
    return { ok: true, tag };
  } catch (error) {
    console.error("Failed to regenerate asset tag:", error);
    return { ok: false, error: "สร้างรหัสทรัพย์สินใหม่ไม่สำเร็จ กรุณาลองใหม่" };
  }
}

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
  revalidatePath("/asset-records");
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
  revalidatePath("/asset-records");
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

interface ImportRow {
  asset_type_id: number | null;
  asset_code: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  warranty_conditions: string | null;
  duplicateCount: number;
}

export interface ImportResult {
  totalRows: number;
  blankSkipped: number;
  mergedDuplicates: number;
  inserted: number;
  errors: string[];
}

function cleanField(v: string | undefined): string | null {
  const trimmed = (v ?? "").trim();
  if (!trimmed || trimmed === "#REF!") return null;
  return trimmed;
}

export async function importAssets(csvText: string): Promise<ImportResult> {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const dataLines = lines.slice(1); // drop header

  const parsed: ImportRow[] = [];
  let blankSkipped = 0;

  for (const line of dataLines) {
    const cells = line.split(",");
    const asset_type_id_raw = cleanField(cells[0]);
    const asset_code = cleanField(cells[1]);
    const brand = cleanField(cells[3]);
    const model = cleanField(cells[4]);
    const serial_number = cleanField(cells[5]);
    const purchase_date = cleanField(cells[6]);
    const warranty_conditions = cleanField(cells[7]);

    if (!asset_type_id_raw && !asset_code && !brand && !model && !serial_number && !purchase_date && !warranty_conditions) {
      blankSkipped++;
      continue;
    }

    parsed.push({
      asset_type_id: asset_type_id_raw ? Number(asset_type_id_raw) : null,
      asset_code,
      brand,
      model,
      serial_number,
      purchase_date,
      warranty_conditions,
      duplicateCount: 1,
    });
  }

  // Merge rows that share the same non-null serial number
  const bySerial = new Map<string, ImportRow>();
  const merged: ImportRow[] = [];
  for (const row of parsed) {
    if (row.serial_number) {
      const existing = bySerial.get(row.serial_number);
      if (existing) {
        existing.duplicateCount++;
        continue;
      }
      bySerial.set(row.serial_number, row);
    }
    merged.push(row);
  }
  const mergedDuplicates = parsed.length - merged.length;

  const assetTypes = await sql<{ id: number; code: string; name: string }[]>`SELECT id, code, name FROM asset_types`;
  const typeById = new Map(assetTypes.map((t) => [t.id, t]));

  const errors: string[] = [];
  let inserted = 0;

  for (const row of merged) {
    const type = row.asset_type_id ? typeById.get(row.asset_type_id) : undefined;
    const assetTag = await generateUniqueAssetTag(row.asset_type_id);

    const assetName = [row.brand, row.model].filter(Boolean).join(" ") || type?.name || "ไม่ระบุชื่อ";
    const note = row.duplicateCount > 1
      ? `นำเข้าซ้ำ ${row.duplicateCount} รายการ (serial ซ้ำในไฟล์ต้นฉบับ)`
      : null;

    try {
      await sql`
        INSERT INTO assets
          (asset_tag, asset_code, asset_name, asset_type_id, brand, model, serial_number,
           purchase_date, warranty_conditions, status, note)
        VALUES (
          ${assetTag}, ${row.asset_code}, ${assetName}, ${row.asset_type_id}, ${row.brand}, ${row.model}, ${row.serial_number},
          ${row.purchase_date}, ${row.warranty_conditions}, 'available', ${note}
        )
      `;
      inserted++;
    } catch (error) {
      console.error("Failed to import asset row:", error);
      errors.push(`แถว serial=${row.serial_number ?? "—"} brand=${row.brand ?? "—"} model=${row.model ?? "—"}: นำเข้าไม่สำเร็จ`);
    }
  }

  revalidatePath("/assets");

  return {
    totalRows: dataLines.length,
    blankSkipped,
    mergedDuplicates,
    inserted,
    errors,
  };
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
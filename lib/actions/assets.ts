"use server";

import sql from "@/lib/db";
import type { ISql } from "postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/roles";

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
  try {
    await requireRole("admin");
  } catch {
    return { ok: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

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
    eid:      (formData.get("eid") as string) || null,
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
  await requireRole("admin");

  const f = extractFields(formData);

  try {
    await sql`
      INSERT INTO assets
        (asset_tag, eid, asset_name, asset_type_id, brand, model, serial_number, phone_number,
         purchase_price, po_number, vendor, warranty_conditions,
         purchase_date, warranty_expiry, status, note)
      VALUES (
        ${f.asset_tag}, ${f.eid}, ${f.asset_name}, ${f.asset_type_id}, ${f.brand}, ${f.model}, ${f.serial_number}, ${f.phone_number},
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

export async function deleteAsset(assetId: number): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireRole("admin");
  } catch {
    return { ok: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  try {
    await sql`DELETE FROM assets WHERE id = ${assetId}`;
  } catch (error) {
    console.error("Failed to delete asset:", error);
    return { ok: false, error: "ไม่สามารถลบทรัพย์สินนี้ได้ เนื่องจากมีประวัติการมอบหมายหรือตรวจสอบอยู่" };
  }

  revalidatePath("/assets");
  return { ok: true };
}

export interface FormActionState {
  error?: string;
}

export async function assignAsset(
  assetId: number,
  _prevState: FormActionState | undefined,
  formData: FormData
): Promise<FormActionState> {
  try {
    await requireRole("admin");
  } catch {
    return { error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  const employeeId = Number(formData.get("employee_id"));
  const assignedAt = (formData.get("assigned_at") as string) || new Date().toISOString().slice(0, 10);
  const note = (formData.get("note") as string) || null;

  if (!employeeId) return { error: "กรุณาเลือกพนักงาน" };

  try {
    await sql.begin(async (tx) => {
      const [asset] = await tx<{ status: string | null }[]>`
        SELECT status FROM assets WHERE id = ${assetId} FOR UPDATE
      `;
      if (!asset) throw new Error("ไม่พบทรัพย์สิน");
      if (asset.status && asset.status !== "available") {
        throw new Error("ทรัพย์สินนี้ไม่พร้อมสำหรับการมอบ (สถานะไม่ใช่ available)");
      }

      const [active] = await tx<{ id: number }[]>`
        SELECT id FROM asset_assignments WHERE asset_id = ${assetId} AND returned_at IS NULL FOR UPDATE
      `;
      if (active) throw new Error("ทรัพย์สินนี้ถูกมอบหมายให้พนักงานคนอื่นอยู่แล้ว");

      await tx`
        INSERT INTO asset_assignments (asset_id, employee_id, assigned_at, note)
        VALUES (${assetId}, ${employeeId}, ${assignedAt}, ${note})
      `;
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด ไม่สามารถมอบหมายได้" };
  }

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

// postgres exposes transaction clients as ISql<{}>; keep the library type here.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export async function getNextDocumentNumber(client: ISql<{}> = sql): Promise<string> {
  const buddhistYear = new Date().getFullYear() + 543;

  const [{ last_seq }] = await client<{ last_seq: number }[]>`
    INSERT INTO document_number_sequences (year, last_seq)
    VALUES (${buddhistYear}, 1)
    ON CONFLICT (year) DO UPDATE SET last_seq = document_number_sequences.last_seq + 1
    RETURNING last_seq
  `;

  return `ทส.ฝข.${String(last_seq).padStart(3, "0")}/${buddhistYear}`;
}

export type DocResult = { ok: true; docNumber: string } | { ok: false; error: string };

export async function acknowledgeAssets(
  employeeId: number,
  assetIds: number[],
  assignedAt: string,
  note: string | null,
  proposedById: number | null,
  endorsedById: number | null,
  approvedById: number | null
): Promise<DocResult> {
  try {
    await requireRole("admin");
  } catch {
    return { ok: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  if (!employeeId) return { ok: false, error: "กรุณาเลือกพนักงาน" };
  if (!assetIds.length) return { ok: false, error: "กรุณาเลือกทรัพย์สินอย่างน้อย 1 รายการ" };

  try {
    const docNumber = await sql.begin(async (tx) => {
      // Validate every asset first so the document sequence is only
      // consumed once we know the whole batch can succeed.
      for (const assetId of assetIds) {
        const [asset] = await tx<{ status: string | null }[]>`
          SELECT status FROM assets WHERE id = ${assetId} FOR UPDATE
        `;
        if (!asset) throw new Error(`ไม่พบทรัพย์สิน #${assetId}`);
        if (asset.status && asset.status !== "available") {
          throw new Error(`ทรัพย์สิน #${assetId} ไม่พร้อมสำหรับการมอบ (สถานะ: ${asset.status})`);
        }

        const [active] = await tx<{ id: number }[]>`
          SELECT id FROM asset_assignments WHERE asset_id = ${assetId} AND returned_at IS NULL FOR UPDATE
        `;
        if (active) throw new Error(`ทรัพย์สิน #${assetId} ถูกมอบหมายอยู่แล้ว`);
      }

      const docNumber = await getNextDocumentNumber(tx);

      for (const assetId of assetIds) {
        await tx`
          INSERT INTO asset_assignments
            (asset_id, employee_id, assigned_at, note, doc_number, proposed_by_id, endorsed_by_id, approved_by_id)
          VALUES (${assetId}, ${employeeId}, ${assignedAt}, ${note}, ${docNumber}, ${proposedById}, ${endorsedById}, ${approvedById})
        `;
      }

      return docNumber;
    });

    revalidatePath("/assignments");
    revalidatePath("/asset-history");
    return { ok: true, docNumber };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด ไม่สามารถบันทึกได้" };
  }
}

export async function returnAssets(
  items: { assignmentId: number; condition: string }[],
  returnedAt: string,
  proposedById: number | null,
  endorsedById: number | null,
  approvedById: number | null
): Promise<DocResult> {
  try {
    await requireRole("admin");
  } catch {
    return { ok: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  if (!items.length) return { ok: false, error: "กรุณาเลือกทรัพย์สินอย่างน้อย 1 รายการ" };

  try {
    const docNumber = await sql.begin(async (tx) => {
      // Validate every assignment first (still active, return date not
      // before the assign date) before the document sequence is consumed.
      for (const item of items) {
        const [assignment] = await tx<{ assigned_date: string }[]>`
          SELECT assigned_at::date::text AS assigned_date FROM asset_assignments
          WHERE id = ${item.assignmentId} AND returned_at IS NULL
          FOR UPDATE
        `;
        if (!assignment) {
          throw new Error(`รายการมอบหมาย #${item.assignmentId} ถูกคืนไปแล้วหรือไม่พบข้อมูล`);
        }
        if (returnedAt < assignment.assigned_date) {
          throw new Error("วันที่คืนต้องไม่ก่อนวันที่รับ");
        }
      }

      const docNumber = await getNextDocumentNumber(tx);

      for (const item of items) {
        await tx`
          UPDATE asset_assignments SET
            returned_at = ${returnedAt},
            condition = ${item.condition},
            return_doc_number = ${docNumber},
            return_proposed_by_id = ${proposedById},
            return_endorsed_by_id = ${endorsedById},
            return_approved_by_id = ${approvedById}
          WHERE id = ${item.assignmentId}
        `;
      }

      return docNumber;
    });

    revalidatePath("/assignments");
    revalidatePath("/asset-history");
    return { ok: true, docNumber };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด ไม่สามารถบันทึกได้" };
  }
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

export async function returnAsset(
  assignmentId: number,
  assetId: number,
  _prevState: FormActionState | undefined,
  _formData: FormData
): Promise<FormActionState> {
  try {
    await requireRole("admin");
  } catch {
    return { error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  const result = await sql`
    UPDATE asset_assignments
    SET returned_at = NOW()
    WHERE id = ${assignmentId} AND asset_id = ${assetId} AND returned_at IS NULL
  `;
  if (result.count === 0) {
    return { error: "ไม่สามารถคืนทรัพย์สินได้ อาจถูกคืนไปแล้วหรือข้อมูลไม่ตรงกับทรัพย์สินนี้" };
  }

  revalidatePath(`/assets/${assetId}`);
  redirect(`/assets/${assetId}`);
}

export async function returnAssetFromEmployee(
  assignmentId: number,
  employeeId: number,
  _prevState: FormActionState | undefined,
  _formData: FormData
): Promise<FormActionState> {
  try {
    await requireRole("admin");
  } catch {
    return { error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  if (!Number.isInteger(assignmentId) || !Number.isInteger(employeeId)) {
    return { error: "ข้อมูลไม่ถูกต้อง" };
  }

  // Single conditional UPDATE: atomic, and only matches an assignment that still
  // belongs to this employee and has not been returned. History row is kept.
  const result = await sql`
    UPDATE asset_assignments
    SET returned_at = NOW()
    WHERE id = ${assignmentId} AND employee_id = ${employeeId} AND returned_at IS NULL
  `;
  if (result.count === 0) {
    return { error: "ไม่สามารถคืนทรัพย์สินได้ อาจถูกคืนไปแล้วหรือข้อมูลไม่ตรงกับพนักงานนี้" };
  }

  revalidatePath(`/employees/${employeeId}`);
  redirect(`/employees/${employeeId}?tab=assignments`);
}

const IMPORT_COLUMNS = [
  "asset_tag", "eid", "asset_name", "asset_type", "brand", "model", "serial_number", "phone_number",
  "purchase_price", "po_number", "vendor", "warranty_conditions", "purchase_date", "warranty_expiry",
  "status", "note",
] as const;
type ImportColumn = (typeof IMPORT_COLUMNS)[number];

// Header names are matched case-insensitively; spaces and dashes count as underscores.
const HEADER_ALIASES: Record<string, ImportColumn> = {
  asset_type_id: "asset_type",
  type: "asset_type",
  serial: "serial_number",
  phone: "phone_number",
  price: "purchase_price",
  po: "po_number",
  warranty: "warranty_conditions",
  remark: "note",
};

// Files without a recognisable header row use this fixed order (the original template).
const LEGACY_ORDER: (ImportColumn | null)[] = [
  "asset_type", "eid", null, "brand", "model", "serial_number", "purchase_date", "warranty_conditions",
];

const IMPORT_STATUSES = ["available", "repair", "damaged", "retired"];

interface ImportRow {
  line: number;
  asset_tag: string | null;
  eid: string | null;
  asset_name: string | null;
  asset_type_id: number | null;
  type_name: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  phone_number: string | null;
  purchase_price: number | null;
  po_number: string | null;
  vendor: string | null;
  warranty_conditions: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  status: string | null;
  note: string | null;
  duplicateCount: number;
  issues: string[]; // problems that stop this row from being imported
  warnings: string[];
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

function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const firstLine = src.split(/\r?\n/, 1)[0] ?? "";
  const delimiter = firstLine.split(";").length > firstLine.split(",").length ? ";" : ",";

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  const endRow = () => {
    row.push(cell);
    cell = "";
    // A completely empty line is not a row; a line like ",,," is (counted as blank later).
    if (!(row.length === 1 && row[0] === "")) rows.push(row);
    row = [];
  };

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === delimiter) {
      row.push(cell);
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      endRow();
    } else {
      cell += ch;
    }
  }
  if (cell !== "" || row.length > 0) endRow();
  return rows;
}

// Accepts 2025-01-31 and 31/01/2025 (also Buddhist-era years); returns ISO or null when invalid.
function normalizeDate(raw: string): string | null {
  let y: number;
  let m: number;
  let d: number;
  let match = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (match) {
    y = Number(match[1]);
    m = Number(match[2]);
    d = Number(match[3]);
  } else if ((match = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/))) {
    d = Number(match[1]);
    m = Number(match[2]);
    y = Number(match[3]);
  } else {
    return null;
  }
  if (y > 2400) y -= 543;
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function addWarranty(date: string, conditions: string): string | null {
  const amount = conditions.match(/\d+/)?.[0];
  if (!amount) return null;
  const d = new Date(`${date}T00:00:00Z`);
  if (conditions.includes("เดือน")) d.setUTCMonth(d.getUTCMonth() + Number(amount));
  else d.setUTCFullYear(d.getUTCFullYear() + Number(amount));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

interface LoadedImport {
  totalRows: number;
  blankSkipped: number;
  mergedDuplicates: number;
  rows: ImportRow[];
  columns: string[]; // recognised columns, in file order
  ignoredColumns: string[];
  legacyFormat: boolean;
}

async function loadImport(csvText: string): Promise<LoadedImport> {
  const table = parseCsv(csvText);
  const header = table[0] ?? [];
  const dataRows = table.slice(1);

  const colIndex = new Map<ImportColumn, number>();
  const ignoredColumns: string[] = [];
  header.forEach((h, i) => {
    // Excel exports can carry a BOM, non-breaking or zero-width spaces that look like part of the name.
    const key = h.replace(/[ ​-‍﻿]/g, " ").trim().toLowerCase().replace(/[\s-]+/g, "_");
    if (!key) return;
    const col = (IMPORT_COLUMNS as readonly string[]).includes(key) ? (key as ImportColumn) : HEADER_ALIASES[key];
    if (col && !colIndex.has(col)) colIndex.set(col, i);
    else ignoredColumns.push(h.trim());
  });

  // Nothing recognised in the first row → treat it as the old fixed-order template.
  const legacyFormat = colIndex.size === 0;
  if (legacyFormat) {
    ignoredColumns.length = 0;
    LEGACY_ORDER.forEach((col, i) => {
      if (col) colIndex.set(col, i);
    });
  }

  const assetTypes = await sql<{ id: number; code: string | null; name: string }[]>`SELECT id, code, name FROM asset_types`;

  const rows: ImportRow[] = [];
  let blankSkipped = 0;

  dataRows.forEach((cells, index) => {
    const get = (col: ImportColumn) => {
      const i = colIndex.get(col);
      return i === undefined ? null : cleanField(cells[i]);
    };

    const issues: string[] = [];
    const warnings: string[] = [];

    const typeRaw = get("asset_type");
    const values = {
      asset_tag: get("asset_tag"),
      eid: get("eid"),
      asset_name: get("asset_name"),
      brand: get("brand"),
      model: get("model"),
      serial_number: get("serial_number"),
      phone_number: get("phone_number"),
      po_number: get("po_number"),
      vendor: get("vendor"),
      warranty_conditions: get("warranty_conditions"),
      note: get("note"),
    };
    const priceRaw = get("purchase_price");
    const purchaseRaw = get("purchase_date");
    const expiryRaw = get("warranty_expiry");
    const statusRaw = get("status");

    if (!typeRaw && !priceRaw && !purchaseRaw && !expiryRaw && !statusRaw && Object.values(values).every((v) => !v)) {
      blankSkipped++;
      return;
    }

    // Type: numeric id, or the type's code / name
    let type: { id: number; name: string } | undefined;
    if (typeRaw) {
      const lower = typeRaw.toLowerCase();
      type = /^\d+$/.test(typeRaw)
        ? assetTypes.find((t) => t.id === Number(typeRaw))
        : assetTypes.find((t) => t.code?.toLowerCase() === lower || t.name.toLowerCase() === lower);
      if (!type) issues.push(`ไม่พบประเภท "${typeRaw}"`);
    } else {
      warnings.push("ไม่ระบุประเภท");
    }

    let purchase_price: number | null = null;
    if (priceRaw) {
      purchase_price = Number(priceRaw.replace(/,/g, ""));
      if (Number.isNaN(purchase_price)) {
        issues.push(`ราคาซื้อไม่ถูกต้อง (${priceRaw})`);
        purchase_price = null;
      }
    }

    let purchase_date: string | null = null;
    if (purchaseRaw) {
      purchase_date = normalizeDate(purchaseRaw);
      if (!purchase_date) issues.push(`วันที่ซื้อไม่ถูกต้อง (${purchaseRaw})`);
    }
    let warranty_expiry: string | null = null;
    if (expiryRaw) {
      warranty_expiry = normalizeDate(expiryRaw);
      if (!warranty_expiry) issues.push(`วันที่หมดประกันไม่ถูกต้อง (${expiryRaw})`);
    } else if (purchase_date && values.warranty_conditions) {
      warranty_expiry = addWarranty(purchase_date, values.warranty_conditions);
    }

    let status: string | null = null;
    if (statusRaw) {
      status = statusRaw.toLowerCase();
      if (!IMPORT_STATUSES.includes(status)) {
        issues.push(`สถานะไม่ถูกต้อง (${statusRaw}) ใช้ได้: ${IMPORT_STATUSES.join(", ")}`);
        status = null;
      }
    }

    rows.push({
      line: index + 2, // +1 for the header, +1 for 1-based numbering
      ...values,
      asset_type_id: type?.id ?? null,
      type_name: type?.name ?? null,
      purchase_price,
      purchase_date,
      warranty_expiry,
      status,
      duplicateCount: 1,
      issues,
      warnings,
    });
  });

  // Merge rows that share the same non-null serial number
  const bySerial = new Map<string, ImportRow>();
  const merged: ImportRow[] = [];
  for (const row of rows) {
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
  for (const row of merged) {
    if (row.duplicateCount > 1) row.warnings.push(`serial ซ้ำในไฟล์ ${row.duplicateCount} แถว (รวมเป็น 1)`);
  }

  return {
    totalRows: dataRows.length,
    blankSkipped,
    mergedDuplicates: rows.length - merged.length,
    rows: merged,
    columns: [...colIndex.keys()],
    ignoredColumns,
    legacyFormat,
  };
}

export interface ImportPreviewRow {
  line: number;
  values: Record<string, string | null>; // keyed by CSV column name, ready to display
  duplicateCount: number;
  errors: string[];
  warnings: string[];
}

export interface ImportPreview {
  totalRows: number;
  blankSkipped: number;
  mergedDuplicates: number;
  readyCount: number;
  errorCount: number;
  columns: string[];
  ignoredColumns: string[];
  legacyFormat: boolean;
  rows: ImportPreviewRow[]; // capped to PREVIEW_ROW_LIMIT
  truncated: boolean;
}

const PREVIEW_ROW_LIMIT = 200;

// Problems that depend on what is already in the database or elsewhere in the file.
async function findConflicts(rows: ImportRow[]) {
  const pick = (key: "serial_number" | "eid" | "asset_tag") =>
    rows.map((r) => r[key]).filter((v): v is string => !!v);
  const serials = pick("serial_number");
  const eids = pick("eid");
  const tags = pick("asset_tag");

  const [dbSerials, dbEids, dbTags] = await Promise.all([
    serials.length ? sql<{ v: string }[]>`SELECT serial_number AS v FROM assets WHERE serial_number IN ${sql(serials)}` : [],
    eids.length ? sql<{ v: string }[]>`SELECT eid AS v FROM assets WHERE eid IN ${sql(eids)}` : [],
    tags.length ? sql<{ v: string }[]>`SELECT asset_tag AS v FROM assets WHERE asset_tag IN ${sql(tags)}` : [],
  ]);
  const existing = {
    serial_number: new Set(dbSerials.map((r) => r.v)),
    eid: new Set(dbEids.map((r) => r.v)),
    asset_tag: new Set(dbTags.map((r) => r.v)),
  };

  const labels = { serial_number: "serial", eid: "EID", asset_tag: "Asset Tag" } as const;
  const seen = { eid: new Set<string>(), asset_tag: new Set<string>() };
  const conflicts = new Map<number, string[]>();
  const add = (line: number, msg: string) => conflicts.set(line, [...(conflicts.get(line) ?? []), msg]);

  for (const row of rows) {
    for (const key of ["serial_number", "eid", "asset_tag"] as const) {
      const value = row[key];
      if (!value) continue;
      if (existing[key].has(value)) add(row.line, `${labels[key]} ซ้ำกับที่มีในระบบ`);
      else if (key !== "serial_number") {
        if (seen[key].has(value)) add(row.line, `${labels[key]} ซ้ำในไฟล์`);
        seen[key].add(value);
      }
    }
  }
  return conflicts;
}

// Dry run of importAssets: same parsing, no writes. Flags what the INSERT would reject.
export async function previewAssetImport(csvText: string): Promise<ImportPreview> {
  await requireRole("admin");

  const loaded = await loadImport(csvText);
  const conflicts = await findConflicts(loaded.rows);

  const preview: ImportPreviewRow[] = loaded.rows.map((row) => ({
    line: row.line,
    values: {
      asset_type: row.type_name,
      asset_tag: row.asset_tag,
      asset_name: row.asset_name ?? ([row.brand, row.model].filter(Boolean).join(" ") || row.type_name),
      eid: row.eid,
      brand: row.brand,
      model: row.model,
      serial_number: row.serial_number,
      phone_number: row.phone_number,
      purchase_price: row.purchase_price != null ? row.purchase_price.toLocaleString("en-US") : null,
      po_number: row.po_number,
      vendor: row.vendor,
      warranty_conditions: row.warranty_conditions,
      purchase_date: row.purchase_date,
      warranty_expiry: row.warranty_expiry,
      status: row.status,
      note: row.note,
    },
    duplicateCount: row.duplicateCount,
    errors: [...row.issues, ...(conflicts.get(row.line) ?? [])],
    warnings: row.warnings,
  }));

  const errorCount = preview.filter((r) => r.errors.length > 0).length;
  return {
    totalRows: loaded.totalRows,
    blankSkipped: loaded.blankSkipped,
    mergedDuplicates: loaded.mergedDuplicates,
    readyCount: preview.length - errorCount,
    errorCount,
    columns: loaded.columns,
    ignoredColumns: loaded.ignoredColumns,
    legacyFormat: loaded.legacyFormat,
    rows: preview.slice(0, PREVIEW_ROW_LIMIT),
    truncated: preview.length > PREVIEW_ROW_LIMIT,
  };
}

export async function importAssets(csvText: string): Promise<ImportResult> {
  await requireRole("admin");

  const { totalRows, blankSkipped, mergedDuplicates, rows } = await loadImport(csvText);

  const errors: string[] = [];
  let inserted = 0;

  for (const row of rows) {
    if (row.issues.length > 0) {
      errors.push(`แถว ${row.line}: ${row.issues.join(", ")}`);
      continue;
    }

    const assetTag = row.asset_tag ?? (await generateUniqueAssetTag(row.asset_type_id));
    const assetName = row.asset_name ?? ([row.brand, row.model].filter(Boolean).join(" ") || row.type_name || "ไม่ระบุชื่อ");
    const note = row.note
      ?? (row.duplicateCount > 1 ? `นำเข้าซ้ำ ${row.duplicateCount} รายการ (serial ซ้ำในไฟล์ต้นฉบับ)` : null);

    try {
      await sql`
        INSERT INTO assets
          (asset_tag, eid, asset_name, asset_type_id, brand, model, serial_number, phone_number,
           purchase_price, po_number, vendor, purchase_date, warranty_conditions, warranty_expiry, status, note)
        VALUES (
          ${assetTag}, ${row.eid}, ${assetName}, ${row.asset_type_id}, ${row.brand}, ${row.model}, ${row.serial_number}, ${row.phone_number},
          ${row.purchase_price}, ${row.po_number}, ${row.vendor}, ${row.purchase_date}, ${row.warranty_conditions}, ${row.warranty_expiry},
          ${row.status ?? "available"}, ${note}
        )
      `;
      inserted++;
    } catch (error) {
      console.error("Failed to import asset row:", error);
      errors.push(`แถว ${row.line} (serial=${row.serial_number ?? "—"}, brand=${row.brand ?? "—"}, model=${row.model ?? "—"}): นำเข้าไม่สำเร็จ — อาจซ้ำกับข้อมูลที่มีอยู่`);
    }
  }

  revalidatePath("/assets");

  return {
    totalRows,
    blankSkipped,
    mergedDuplicates,
    inserted,
    errors,
  };
}

export async function updateAsset(id: number, formData: FormData) {
  await requireRole("admin");

  const f = extractFields(formData);

  try {
    await sql.begin(async (tx) => {
    const [prev] = await tx`SELECT phone_number FROM assets WHERE id = ${id}`;
    await tx`
      UPDATE assets SET
        asset_tag           = ${f.asset_tag},
        eid          = ${f.eid},
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
    // Update the holder's phone only if it was the same number as this asset's old one
    if (prev?.phone_number && f.phone_number && prev.phone_number.trim() !== f.phone_number.trim()) {
      await tx`
        UPDATE employees SET phone = ${f.phone_number}, updated_at = NOW()
        WHERE btrim(phone) = ${prev.phone_number.trim()}
          AND id IN (SELECT employee_id FROM asset_assignments WHERE asset_id = ${id} AND returned_at IS NULL)
      `;
    }
    });
  } catch (error) {
    console.error("Failed to update asset:", error);
    throw new Error("ไม่สามารถอัปเดตทรัพย์สินได้ อาจมีข้อมูลบางอย่างซ้ำในระบบ");
  }

  revalidatePath("/employees");
  revalidatePath("/employees/information");
  revalidatePath("/assets");
  redirect("/assets");
}

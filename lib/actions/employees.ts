"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";

const PHOTO_BUCKET = "employee-photos";

export async function uploadEmployeePhoto(
  employeeId: number,
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    await requireRole("admin");
  } catch {
    return { ok: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  const file = formData.get("photo") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "กรุณาเลือกไฟล์รูปภาพ" };
  if (!file.type.startsWith("image/")) return { ok: false, error: "รองรับเฉพาะไฟล์รูปภาพ" };
  if (file.size > 5 * 1024 * 1024) return { ok: false, error: "ไฟล์ต้องมีขนาดไม่เกิน 5MB" };

  const supabase = await createClient();
  const ext = file.name.split(".").pop() || "jpg";
  const path = `${employeeId}/${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage.from(PHOTO_BUCKET).upload(path, file, {
    contentType: file.type,
  });
  if (uploadError) {
    console.error("Failed to upload employee photo:", uploadError);
    return { ok: false, error: "อัปโหลดรูปภาพไม่สำเร็จ กรุณาลองใหม่" };
  }

  const { data } = supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path);

  await sql`UPDATE employees SET photo_url = ${data.publicUrl}, updated_at = NOW() WHERE id = ${employeeId}`;

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/employees");
  revalidatePath("/employees/information");
  return { ok: true, url: data.publicUrl };
}

function extractFields(formData: FormData) {
  const deptRaw    = formData.get("department_id") as string;
  const posRaw     = formData.get("position_id")   as string;
  const areaRaw    = formData.get("sales_area_id") as string;
  const managerRaw = formData.get("manager_id")    as string;

  return {
    employee_id:   formData.get("employee_id")  as string,
    prefix_th:     (formData.get("prefix_th")   as string) || null,
    first_name:     formData.get("first_name")  as string,
    last_name:      formData.get("last_name")   as string,
    prefix_en:     (formData.get("prefix_en")   as string) || null,
    first_name_en: (formData.get("first_name_en") as string) || null,
    last_name_en:  (formData.get("last_name_en")  as string) || null,
    date_of_birth: (formData.get("date_of_birth") as string) || null,
    start_date:    (formData.get("start_date")    as string) || null,
    resigned_at:   (formData.get("resigned_at")   as string) || null,
    national_id:   (formData.get("national_id")   as string) || null,
    phone:         (formData.get("phone")          as string) || null,
    email:         (formData.get("email")          as string) || null,
    gender:        (formData.get("gender")         as string) || null,
    department_id: deptRaw ? Number(deptRaw) : null,
    position_id:   posRaw  ? Number(posRaw)  : null,
    sales_area_id: areaRaw ? Number(areaRaw) : null,
    manager_id:    managerRaw ? Number(managerRaw) : null,
    is_active:     formData.get("is_active") !== "false",
  };
}

export async function createEmployee(formData: FormData) {
  await requireRole("admin");

  const f = extractFields(formData);

  try {
    await sql`
      INSERT INTO employees
        (employee_id, prefix_th, first_name, last_name,
         prefix_en, first_name_en, last_name_en,
         date_of_birth, national_id, phone, email, gender, start_date, resigned_at,
         department_id, position_id, sales_area_id, manager_id, is_active)
      VALUES (
        ${f.employee_id}, ${f.prefix_th}, ${f.first_name}, ${f.last_name},
        ${f.prefix_en}, ${f.first_name_en}, ${f.last_name_en},
        ${f.date_of_birth}, ${f.national_id}, ${f.phone}, ${f.email}, ${f.gender}, ${f.start_date}, ${f.resigned_at},
        ${f.department_id}, ${f.position_id}, ${f.sales_area_id}, ${f.manager_id}, ${f.is_active}
      )
    `;
  } catch (error) {
    console.error("Failed to create employee:", error);
    throw new Error("ไม่สามารถเพิ่มพนักงานได้ อาจมีรหัสพนักงานหรือข้อมูลบางอย่างซ้ำในระบบ");
  }

  revalidatePath("/employees");
  revalidatePath("/employees/information");
  redirect("/employees/information");
}

type Change = { label: string; from: string | null; to: string | null };

const MASKED = "(แก้ไขแล้ว)"; // sensitive values are never written to the log

function norm(v: unknown): string | null {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v);
}

async function diffEmployee(
  tx: typeof sql,
  prev: Record<string, unknown>,
  f: ReturnType<typeof extractFields>
): Promise<Change[]> {
  const lookup = async (table: string, col: string, ids: unknown[]) => {
    const list = ids.filter((x): x is number => typeof x === "number");
    if (list.length === 0) return new Map<number, string>();
    const rows = await tx`SELECT id, ${tx(col)} AS name FROM ${tx(table)} WHERE id IN ${tx(list)}`;
    return new Map<number, string>(rows.map((r) => [r.id as number, r.name as string]));
  };
  const [depts, positions, areas, managers] = await Promise.all([
    lookup("departments", "name", [prev.department_id, f.department_id]),
    lookup("positions", "position", [prev.position_id, f.position_id]),
    lookup("sales_areas", "area_name", [prev.sales_area_id, f.sales_area_id]),
    (async () => {
      const list = [prev.manager_id, f.manager_id].filter((x): x is number => typeof x === "number");
      if (list.length === 0) return new Map<number, string>();
      const rows = await tx`
        SELECT id, TRIM(CONCAT(first_name, ' ', last_name)) AS name FROM employees WHERE id IN ${tx(list)}
      `;
      return new Map<number, string>(rows.map((r) => [r.id as number, r.name as string]));
    })(),
  ]);
  const named = (m: Map<number, string>) => (v: unknown) => (typeof v === "number" ? m.get(v) ?? String(v) : null);

  const fields: { key: keyof typeof f; label: string; show?: (v: unknown) => string | null; mask?: boolean }[] = [
    { key: "employee_id", label: "รหัสพนักงาน" },
    { key: "prefix_th", label: "คำนำหน้า (ไทย)" },
    { key: "first_name", label: "ชื่อ" },
    { key: "last_name", label: "นามสกุล" },
    { key: "prefix_en", label: "Prefix (English)" },
    { key: "first_name_en", label: "First name (English)" },
    { key: "last_name_en", label: "Last name (English)" },
    { key: "national_id", label: "เลขบัตรประชาชน", mask: true },
    { key: "date_of_birth", label: "วันเกิด", mask: true },
    { key: "gender", label: "เพศ" },
    { key: "phone", label: "เบอร์โทรศัพท์" },
    { key: "email", label: "อีเมล" },
    { key: "start_date", label: "วันที่เริ่มงาน" },
    { key: "resigned_at", label: "วันที่ลาออก" },
    { key: "department_id", label: "ฝ่าย", show: named(depts) },
    { key: "position_id", label: "ตำแหน่ง", show: named(positions) },
    { key: "sales_area_id", label: "เขตการขาย", show: named(areas) },
    { key: "manager_id", label: "ผู้บังคับบัญชา", show: named(managers) },
    { key: "is_active", label: "สถานะ", show: (v) => (v ? "Active" : "Inactive") },
  ];

  const changes: Change[] = [];
  for (const { key, label, show, mask } of fields) {
    const before = prev[key];
    const after = f[key];
    if (norm(before) === norm(after)) continue;
    changes.push({
      label,
      from: mask ? (norm(before) ? MASKED : null) : show ? show(before) : norm(before),
      to: mask ? (norm(after) ? MASKED : null) : show ? show(after) : norm(after),
    });
  }
  return changes;
}

export async function updateEmployee(id: number, formData: FormData) {
  await requireRole("admin");

  const f = extractFields(formData);
  let changes: Change[] = [];

  try {
    await sql.begin(async (tx) => {
    const [prev] = await tx`SELECT * FROM employees WHERE id = ${id}`;
    changes = prev ? await diffEmployee(tx as unknown as typeof sql, prev, f) : [];
    await tx`
      UPDATE employees SET
        employee_id   = ${f.employee_id},
        prefix_th     = ${f.prefix_th},
        first_name    = ${f.first_name},
        last_name     = ${f.last_name},
        prefix_en     = ${f.prefix_en},
        first_name_en = ${f.first_name_en},
        last_name_en  = ${f.last_name_en},
        date_of_birth = ${f.date_of_birth},
        start_date    = ${f.start_date},
        resigned_at   = ${f.resigned_at},
        national_id   = ${f.national_id},
        phone         = ${f.phone},
        email         = ${f.email},
        gender        = ${f.gender},
        department_id = ${f.department_id},
        position_id   = ${f.position_id},
        sales_area_id = ${f.sales_area_id},
        manager_id    = ${f.manager_id},
        is_active     = ${f.is_active},
        updated_at    = NOW()
      WHERE id = ${id}
    `;
    // Move the old number to the new one only on held assets that carried the employee's old number
    if (prev?.phone && f.phone && prev.phone.trim() !== f.phone.trim()) {
      await tx`
        UPDATE assets SET phone_number = ${f.phone}, updated_at = NOW()
        WHERE btrim(phone_number) = ${prev.phone.trim()}
          AND id IN (SELECT asset_id FROM asset_assignments WHERE employee_id = ${id} AND returned_at IS NULL)
      `;
    }
    });
  } catch (error) {
    console.error("Failed to update employee:", error);
    throw new Error("ไม่สามารถอัปเดตข้อมูลพนักงานได้ อาจมีรหัสพนักงานหรือข้อมูลบางอย่างซ้ำในระบบ");
  }

  // Logged outside the update transaction so a missing/failed log table never blocks saving
  if (changes.length > 0) {
    try {
      const supabase = await createClient();
      const { data } = await supabase.auth.getUser();
      const actor = data.user?.email ?? null;
      await sql`
        INSERT INTO employee_change_log (employee_id, field_label, old_value, new_value, changed_by)
        SELECT ${id}, c.label, c.from_value, c.to_value, ${actor}
        FROM json_to_recordset(${JSON.stringify(changes.map((c) => ({ label: c.label, from_value: c.from, to_value: c.to })))}::json)
          AS c(label text, from_value text, to_value text)
      `;
    } catch (error) {
      console.error("Failed to write employee change log:", error);
    }
  }

  revalidatePath("/employees");
  revalidatePath("/employees/information");
  revalidatePath(`/employees/${id}`);
  revalidatePath("/assets");
  redirect("/employees/information");
}

export async function bulkUpdateGender(formData: FormData) {
  await requireRole("admin");

  const updates: { id: number; gender: "male" | "female" }[] = [];
  for (const [key, value] of formData.entries()) {
    if (!key.startsWith("gender_")) continue;
    if (value !== "male" && value !== "female") continue;
    updates.push({ id: Number(key.slice("gender_".length)), gender: value });
  }

  if (updates.length > 0) {
    try {
      await sql.begin(async (tx) => {
        for (const u of updates) {
          await tx`UPDATE employees SET gender = ${u.gender}, updated_at = NOW() WHERE id = ${u.id}`;
        }
      });
    } catch (error) {
      console.error("Failed to bulk update gender:", error);
      throw new Error("ไม่สามารถบันทึกข้อมูลเพศได้");
    }
  }

  revalidatePath("/employees");
  revalidatePath("/employees/information");
  revalidatePath("/employees/gender");
  redirect("/employees/gender");
}

export async function deleteEmployee(id: number) {
  await requireRole("admin");

  try {
    await sql`DELETE FROM employees WHERE id = ${id}`;
  } catch (error) {
    console.error("Failed to delete employee:", error);
    throw new Error("ไม่สามารถลบข้อมูลพนักงานได้");
  }
  revalidatePath("/employees");
  revalidatePath("/employees/information");
  redirect("/employees/information");
}

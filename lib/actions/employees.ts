"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";
import type { FormActionState } from "@/lib/actions/assets";
import { CHANGE_TYPES } from "@/lib/employee-change-types";
import { currentUserEmail, lookupName } from "@/lib/employee-change-server";

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

export async function updateEmployee(id: number, formData: FormData) {
  await requireRole("admin");

  const f = extractFields(formData);

  try {
    await sql.begin(async (tx) => {
    const [prev] = await tx`SELECT phone, department_id, position_id, sales_area_id FROM employees WHERE id = ${id}`;
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
    if (prev) {
      // Org changes made from the edit form also land in the history timeline
      const actor = await currentUserEmail();
      for (const type of CHANGE_TYPES) {
        const oldId = prev[type.column] ?? null;
        const newId = f[type.column];
        if (oldId === newId) continue;
        try {
          await tx.savepoint(async (sp) => {
            const [from, to] = await Promise.all([
              lookupName(sp, type, oldId),
              lookupName(sp, type, newId),
            ]);
            await sp`
              INSERT INTO employee_change_history
                (employee_id, change_type, old_value, new_value, effective_date, reason, status, applied_at, recorded_by)
              VALUES (${id}, ${type.key}, ${sp.json({ id: oldId, name: from })}, ${sp.json({ id: newId, name: to })},
                      CURRENT_DATE, NULL, 'applied', NOW(), ${actor})
            `;
          });
        } catch (error) {
          // history table not migrated yet — never block the profile save
          console.error("Failed to write employee change history:", error);
        }
      }
    }
    });
  } catch (error) {
    console.error("Failed to update employee:", error);
    throw new Error("ไม่สามารถอัปเดตข้อมูลพนักงานได้ อาจมีรหัสพนักงานหรือข้อมูลบางอย่างซ้ำในระบบ");
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

export async function recordEmployeeChange(
  employeeId: number,
  _prev: FormActionState | undefined,
  formData: FormData
): Promise<FormActionState> {
  try {
    await requireRole("admin");
  } catch {
    return { error: "คุณไม่มีสิทธิ์บันทึกประวัติการเปลี่ยนแปลง" };
  }

  const type = CHANGE_TYPES.find((t) => t.key === formData.get("change_type"));
  const newId = Number(formData.get("new_id"));
  const effective = String(formData.get("effective_date") ?? "");

  if (!type) return { error: "กรุณาเลือกประเภทการเปลี่ยนแปลง" };
  if (!Number.isInteger(newId) || newId <= 0) return { error: `กรุณาเลือก${type.newLabel}` };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(effective) || Number.isNaN(Date.parse(effective))) {
    return { error: "กรุณาระบุวันที่มีผล" };
  }

  const actor = await currentUserEmail();

  try {
    const error = await sql.begin(async (tx) => {
      const [emp] = await tx`SELECT ${tx(type.column)} AS current_id FROM employees WHERE id = ${employeeId} FOR UPDATE`;
      if (!emp) return "ไม่พบข้อมูลพนักงาน";
      const currentId = (emp.current_id as number | null) ?? null;

      const newName = await lookupName(tx, type, newId);
      if (!newName) return `ไม่พบ${type.newLabel}ในระบบ`;
      if (newId === currentId) return `${type.newLabel}ต้องแตกต่างจาก${type.oldLabel}`;

      const [dup] = await tx`
        SELECT 1 FROM employee_change_history
        WHERE employee_id = ${employeeId} AND change_type = ${type.key}
          AND effective_date = ${effective} AND (new_value->>'id')::int = ${newId}
      `;
      if (dup) return "มีรายการเปลี่ยนแปลงนี้ในวันที่มีผลเดียวกันแล้ว";

      const oldName = await lookupName(tx, type, currentId);
      const [{ due }] = await tx`SELECT ${effective}::date <= (NOW() AT TIME ZONE 'Asia/Bangkok')::date AS due`;

      await tx`
        INSERT INTO employee_change_history
          (employee_id, change_type, old_value, new_value, effective_date, reason, status, applied_at, recorded_by)
        VALUES (
          ${employeeId}, ${type.key},
          ${tx.json({ id: currentId, name: oldName })}, ${tx.json({ id: newId, name: newName })},
          ${effective}, ${null}, ${due ? "applied" : "pending"}, ${due ? tx`NOW()` : null}, ${actor}
        )
      `;

      // A backdated entry must not overwrite a newer change that is already in effect
      if (due) {
        const [newer] = await tx`
          SELECT 1 FROM employee_change_history
          WHERE employee_id = ${employeeId} AND change_type = ${type.key}
            AND status = 'applied' AND effective_date > ${effective}
        `;
        if (!newer) {
          await tx`UPDATE employees SET ${tx(type.column)} = ${newId}, updated_at = NOW() WHERE id = ${employeeId}`;
        }
      }
      return null;
    });
    if (error) return { error };
  } catch (e) {
    console.error("Failed to record employee change:", e);
    return { error: "บันทึกไม่สำเร็จ กรุณาตรวจสอบว่าได้สร้างตารางประวัติในฐานข้อมูลแล้ว" };
  }

  revalidatePath(`/employees/${employeeId}`);
  revalidatePath("/employees");
  revalidatePath("/employees/information");
  return {};
}

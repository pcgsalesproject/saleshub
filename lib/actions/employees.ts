"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const PHOTO_BUCKET = "employee-photos";

export async function uploadEmployeePhoto(
  employeeId: number,
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
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

  await sql`UPDATE employees SET photo_url = ${data.publicUrl} WHERE id = ${employeeId}`;

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
  const f = extractFields(formData);

  try {
    await sql`
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
        is_active     = ${f.is_active}
      WHERE id = ${id}
    `;
  } catch (error) {
    console.error("Failed to update employee:", error);
    throw new Error("ไม่สามารถอัปเดตข้อมูลพนักงานได้ อาจมีรหัสพนักงานหรือข้อมูลบางอย่างซ้ำในระบบ");
  }

  revalidatePath("/employees");
  revalidatePath("/employees/information");
  revalidatePath(`/employees/${id}`);
  redirect("/employees/information");
}

export async function bulkUpdateGender(formData: FormData) {
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
          await tx`UPDATE employees SET gender = ${u.gender} WHERE id = ${u.id}`;
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

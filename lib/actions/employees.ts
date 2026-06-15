"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function extractFields(formData: FormData) {
  const deptRaw = formData.get("department_id") as string;
  const posRaw  = formData.get("position_id")   as string;
  const areaRaw = formData.get("sales_area_id") as string;

  return {
    employee_id:   formData.get("employee_id")  as string,
    prefix_th:     (formData.get("prefix_th")   as string) || null,
    first_name:     formData.get("first_name")  as string,
    last_name:      formData.get("last_name")   as string,
    prefix_en:     (formData.get("prefix_en")   as string) || null,
    first_name_en: (formData.get("first_name_en") as string) || null,
    last_name_en:  (formData.get("last_name_en")  as string) || null,
    date_of_birth: (formData.get("date_of_birth") as string) || null,
    national_id:   (formData.get("national_id")   as string) || null,
    phone:         (formData.get("phone")          as string) || null,
    email:         (formData.get("email")          as string) || null,
    department_id: deptRaw ? Number(deptRaw) : null,
    position_id:   posRaw  ? Number(posRaw)  : null,
    sales_area_id: areaRaw ? Number(areaRaw) : null,
    is_active:     formData.get("is_active") !== "false",
  };
}

export async function createEmployee(formData: FormData) {
  const f = extractFields(formData);

  await sql`
    INSERT INTO employees
      (employee_id, prefix_th, first_name, last_name,
       prefix_en, first_name_en, last_name_en,
       date_of_birth, national_id, phone, email,
       department_id, position_id, sales_area_id, is_active)
    VALUES (
      ${f.employee_id}, ${f.prefix_th}, ${f.first_name}, ${f.last_name},
      ${f.prefix_en}, ${f.first_name_en}, ${f.last_name_en},
      ${f.date_of_birth}, ${f.national_id}, ${f.phone}, ${f.email},
      ${f.department_id}, ${f.position_id}, ${f.sales_area_id}, ${f.is_active}
    )
  `;

  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployee(id: number, formData: FormData) {
  const f = extractFields(formData);

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
      national_id   = ${f.national_id},
      phone         = ${f.phone},
      email         = ${f.email},
      department_id = ${f.department_id},
      position_id   = ${f.position_id},
      sales_area_id = ${f.sales_area_id},
      is_active     = ${f.is_active}
    WHERE id = ${id}
  `;

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect("/employees");
}

export async function deleteEmployee(id: number) {
  await sql`DELETE FROM employees WHERE id = ${id}`;
  revalidatePath("/employees");
  redirect("/employees");
}

"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function extractFields(formData: FormData) {
  const title_th    = (formData.get("title_th")    as string) || null;
  const first_name  =  formData.get("first_name")  as string;
  const last_name   =  formData.get("last_name")   as string;
  const full_name   = (formData.get("full_name")   as string) || `${title_th ?? ""} ${first_name} ${last_name}`.trim();

  const prefix       = (formData.get("prefix")       as string) || null;
  const first_name_en = (formData.get("first_name_en") as string) || null;
  const last_name_en  = (formData.get("last_name_en")  as string) || null;
  const full_name_en  = (formData.get("full_name_en")  as string) ||
    [prefix, first_name_en, last_name_en].filter(Boolean).join(" ") || null;

  return {
    employee_id:   formData.get("employee_id")  as string,
    title_th,
    first_name,
    last_name,
    full_name,
    prefix,
    first_name_en,
    last_name_en,
    full_name_en,
    date_of_birth: formData.get("date_of_birth") || null,
    national_id:   formData.get("national_id")   || null,
    phone:         formData.get("phone")          || null,
    email:         formData.get("email")          || null,
    department_id: formData.get("department_id") || null,
    position_id:   formData.get("position_id")   || null,
    sales_zone:    formData.get("sales_zone")     || null,
    provinces:     formData.get("provinces")      || null,
    status:        formData.get("status")         || "Active",
  };
}

export async function createEmployee(formData: FormData) {
  const f = extractFields(formData);

  await pool.execute(
    `INSERT INTO employees
       (employee_id, title_th, first_name, last_name, full_name,
        prefix, first_name_en, last_name_en, full_name_en,
        date_of_birth, national_id, phone, email,
        department_id, position_id, sales_zone, provinces, status)
     VALUES (?,?,?,?,?, ?,?,?,?, ?,?,?,?, ?,?,?,?,?)`,
    [
      f.employee_id, f.title_th, f.first_name, f.last_name, f.full_name,
      f.prefix, f.first_name_en, f.last_name_en, f.full_name_en,
      f.date_of_birth, f.national_id, f.phone, f.email,
      f.department_id, f.position_id, f.sales_zone, f.provinces, f.status,
    ]
  );

  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployee(id: number, formData: FormData) {
  const f = extractFields(formData);

  await pool.execute(
    `UPDATE employees SET
       employee_id=?, title_th=?, first_name=?, last_name=?, full_name=?,
       prefix=?, first_name_en=?, last_name_en=?, full_name_en=?,
       date_of_birth=?, national_id=?, phone=?, email=?,
       department_id=?, position_id=?, sales_zone=?, provinces=?, status=?
     WHERE id=?`,
    [
      f.employee_id, f.title_th, f.first_name, f.last_name, f.full_name,
      f.prefix, f.first_name_en, f.last_name_en, f.full_name_en,
      f.date_of_birth, f.national_id, f.phone, f.email,
      f.department_id, f.position_id, f.sales_zone, f.provinces, f.status,
      id,
    ]
  );

  revalidatePath("/employees");
  revalidatePath(`/employees/${id}`);
  redirect("/employees");
}

export async function deleteEmployee(id: number) {
  await pool.execute("DELETE FROM employees WHERE id = ?", [id]);
  revalidatePath("/employees");
  redirect("/employees");
}

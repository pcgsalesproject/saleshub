"use server";

import pool from "@/lib/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createEmployee(formData: FormData) {
  const fields = {
    employee_id: formData.get("employee_id") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    date_of_birth: formData.get("date_of_birth") || null,
    national_id: formData.get("national_id") || null,
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
    department_id: formData.get("department_id") || null,
    position: formData.get("position") || null,
    status: formData.get("status") || "Active",
  };

  await pool.execute(
    `INSERT INTO employees
       (employee_id, first_name, last_name, date_of_birth, national_id, phone, email, department_id, position, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      fields.employee_id,
      fields.first_name,
      fields.last_name,
      fields.date_of_birth,
      fields.national_id,
      fields.phone,
      fields.email,
      fields.department_id,
      fields.position,
      fields.status,
    ]
  );

  revalidatePath("/employees");
  redirect("/employees");
}

export async function updateEmployee(id: number, formData: FormData) {
  const fields = {
    employee_id: formData.get("employee_id") as string,
    first_name: formData.get("first_name") as string,
    last_name: formData.get("last_name") as string,
    date_of_birth: formData.get("date_of_birth") || null,
    national_id: formData.get("national_id") || null,
    phone: formData.get("phone") || null,
    email: formData.get("email") || null,
    department_id: formData.get("department_id") || null,
    position: formData.get("position") || null,
    status: formData.get("status") || "Active",
  };

  await pool.execute(
    `UPDATE employees SET
       employee_id = ?, first_name = ?, last_name = ?, date_of_birth = ?,
       national_id = ?, phone = ?, email = ?, department_id = ?, position = ?, status = ?
     WHERE id = ?`,
    [
      fields.employee_id,
      fields.first_name,
      fields.last_name,
      fields.date_of_birth,
      fields.national_id,
      fields.phone,
      fields.email,
      fields.department_id,
      fields.position,
      fields.status,
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

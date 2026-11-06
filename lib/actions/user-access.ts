"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sql from "@/lib/db";
import { ALL_MENU_KEYS, type MenuKey } from "@/lib/menu-config";
import { getCurrentUserEmail } from "@/lib/menu-access";
import { requireRole, type Role } from "@/lib/roles";
import { createAdminClient, createStatelessClient } from "@/lib/supabase/admin";

const USERNAME_RE = /^[a-zA-Z0-9._-]{3,32}$/;
const EXISTS_MSG = "อีเมลนี้มีบัญชีล็อกอินอยู่แล้ว";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readMenuKeys(formData: FormData): MenuKey[] {
  return [...new Set(formData.getAll("menu_keys").filter(
    (value): value is MenuKey => typeof value === "string" && ALL_MENU_KEYS.includes(value as MenuKey)
  ))];
}

function readFields(formData: FormData) {
  const username = String(formData.get("username") ?? "").trim().toLowerCase();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "viewer") as Role;
  if (!USERNAME_RE.test(username)) throw new Error("Username ต้องเป็น a-z 0-9 . _ - ยาว 3-32 ตัวอักษร");
  if (!EMAIL_RE.test(email)) throw new Error("กรุณาระบุอีเมลให้ถูกต้อง");
  if (role !== "admin" && role !== "viewer") throw new Error("ไม่พบ role ที่เลือก");
  return { username, email, role, menuKeys: readMenuKeys(formData) };
}

// Creates the Supabase login for `email` with the password the admin typed. Uses the
// service-role key when configured (account is pre-confirmed); otherwise a normal sign-up,
// which needs "Allow new users to sign up" on and "Confirm email" off in Supabase.
async function createLoginAccount(email: string, password: string) {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { error } = await createAdminClient().auth.admin.createUser({ email, password, email_confirm: true });
    if (error) throw new Error(/already|registered|exists/i.test(error.message) ? EXISTS_MSG : error.message);
    return;
  }
  const { data, error } = await createStatelessClient().auth.signUp({ email, password });
  if (error) throw new Error(error.message);
  // Supabase hides duplicates by returning a user with no identities.
  if (data.user && data.user.identities?.length === 0) throw new Error(EXISTS_MSG);
}

// Reads the optional password pair; returns "" when left blank.
function readPassword(formData: FormData, required: boolean): string {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (!password && !required) return "";
  if (password.length < 8) throw new Error("รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร");
  if (password !== confirm) throw new Error("รหัสผ่านและการยืนยันไม่ตรงกัน");
  return password;
}

// Replaces the Supabase login password and signs the user out everywhere. Writes the bcrypt
// hash straight to auth.users so it works without the service-role key.
async function setLoginPassword(email: string, password: string) {
  const [row] = await sql<{ id: string }[]>`
    UPDATE auth.users
    SET encrypted_password = crypt(${password}, gen_salt('bf', 10)), updated_at = NOW()
    WHERE lower(email) = ${email}
    RETURNING id
  `;
  if (!row) throw new Error("ไม่พบบัญชีล็อกอินของอีเมลนี้ใน Supabase");
  if (email !== await getCurrentUserEmail()) {
    await sql`DELETE FROM auth.sessions WHERE user_id = ${row.id}`;
  }
}

async function assertUsernameFree(username: string, exceptEmail?: string) {
  const [taken] = await sql<{ email: string }[]>`
    SELECT email FROM users WHERE lower(username) = ${username} LIMIT 1
  `;
  if (taken && taken.email.toLowerCase() !== exceptEmail) throw new Error("Username นี้ถูกใช้แล้ว");
}

export async function createUserAccess(_: unknown, formData: FormData): Promise<{ error: string } | null> {
  try {
    await requireRole("admin");
    const { username, email, role, menuKeys } = readFields(formData);
    await assertUsernameFree(username);

    const password = readPassword(formData, true);
    await createLoginAccount(email, password);

    await sql`
      INSERT INTO users (username, email, role, menu_keys)
      VALUES (${username}, ${email}, ${role}, ${sql.array(menuKeys)})
    `;
    revalidatePath("/settings/users");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ" };
  }
  redirect("/settings/users");
}

export async function updateUserAccess(_: unknown, formData: FormData): Promise<{ error: string } | null> {
  try {
    await requireRole("admin");
    const { username, email, role, menuKeys } = readFields(formData);
    await assertUsernameFree(username, email);
    const newPassword = readPassword(formData, false);

    const currentEmail = await getCurrentUserEmail();
    if (email === currentEmail && role !== "admin") {
      throw new Error("ไม่สามารถลดสิทธิ์ admin ของบัญชีที่กำลังใช้งานได้");
    }
    await sql`
      UPDATE users
      SET username = ${username}, role = ${role}, menu_keys = ${sql.array(menuKeys)}, updated_at = NOW()
      WHERE lower(email) = ${email}
    `;
    if (newPassword) await setLoginPassword(email, newPassword);
    revalidatePath("/settings/users");
    revalidatePath("/", "layout");
  } catch (e) {
    return { error: e instanceof Error ? e.message : "บันทึกไม่สำเร็จ" };
  }
  redirect("/settings/users");
}

export async function toggleUserActive(formData: FormData) {
  await requireRole("admin");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const active = formData.get("active") === "true";
  if (!active && email === await getCurrentUserEmail()) {
    throw new Error("ไม่สามารถปิดใช้งานบัญชีที่กำลังใช้งานอยู่ได้");
  }
  await sql`UPDATE users SET is_active = ${active}, updated_at = NOW() WHERE lower(email) = ${email}`;
  revalidatePath("/settings/users");
}

export interface ManagedUser {
  email: string;
  username: string;
  role: Role;
  menu_keys: string[];
  is_active: boolean;
  full_name: string | null;
  employee_code: string | null;
  department: string | null;
  last_sign_in_at: Date | null;
}

export async function getManagedUsers(): Promise<ManagedUser[]> {
  await requireRole("admin");
  // Name/department come from the employee with the same email; last login from Supabase auth.
  return sql<ManagedUser[]>`
    SELECT u.email, u.username, u.role, u.menu_keys, u.is_active,
      NULLIF(TRIM(CONCAT_WS(' ', e.first_name, e.last_name)), '') AS full_name,
      e.employee_id AS employee_code,
      d.name AS department,
      au.last_sign_in_at
    FROM users u
    LEFT JOIN employees e ON lower(e.email) = lower(u.email)
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN auth.users au ON lower(au.email) = lower(u.email)
    ORDER BY lower(u.username)
  `;
}

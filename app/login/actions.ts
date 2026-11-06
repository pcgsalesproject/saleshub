"use server";

import { redirect } from "next/navigation";
import sql from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { getLandingPath } from "@/lib/menu-access";

async function resolveEmail(identifier: string): Promise<string> {
  // Only enabled users in `users` may sign in, by username or by their email.
  const [row] = await sql<{ email: string }[]>`
    SELECT email FROM users
    WHERE is_active AND (lower(username) = ${identifier} OR lower(email) = ${identifier})
    LIMIT 1
  `;
  return row?.email ?? "";
}

export async function login(_: unknown, formData: FormData) {
  const identifier = (formData.get("username") as string ?? "").trim().toLowerCase();
  const password = formData.get("password") as string ?? "";

  const email = await resolveEmail(identifier);
  if (!email) return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: "บัญชียังไม่ได้ยืนยันอีเมล กรุณากดลิงก์ยืนยันในอีเมล หรือให้ผู้ดูแลปิด Confirm email ใน Supabase" };
    }
    return { error: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" };
  }

  redirect(await getLandingPath(email));
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(_: unknown, formData: FormData) {
  const email = await resolveEmail((formData.get("username") as string ?? "").trim().toLowerCase());
  if (email) {
    const supabase = await createClient();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/reset-password`,
    });
  }
  // Same response either way so usernames cannot be probed.
  return { sent: true };
}

export async function resetPassword(_: unknown, formData: FormData) {
  const password = String(formData.get("password") ?? "");
  if (password.length < 8) return { error: "รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร" };
  if (password !== String(formData.get("confirm") ?? "")) return { error: "รหัสผ่านไม่ตรงกัน" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.updateUser({ password });
  if (error) return { error: "ลิงก์หมดอายุหรือไม่ถูกต้อง กรุณาขอรีเซ็ตรหัสผ่านใหม่" };
  redirect(await getLandingPath(data.user.email ?? ""));
}

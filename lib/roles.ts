import sql from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "viewer";

export async function getCurrentRole(): Promise<Role> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return "viewer";

  const rows = await sql<{ role: Role }[]>`
    SELECT role FROM users
    WHERE lower(email) = lower(${email}) AND is_active
    LIMIT 1
  `;
  return rows[0]?.role ?? "viewer";
}

export async function requireRole(...allowed: Role[]): Promise<Role> {
  const role = await getCurrentRole();
  if (!allowed.includes(role)) {
    throw new Error("คุณไม่มีสิทธิ์ดำเนินการนี้");
  }
  return role;
}

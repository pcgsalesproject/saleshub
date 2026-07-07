import sql from "@/lib/db";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "viewer";

export async function getCurrentRole(): Promise<Role> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return "viewer";

  const rows = await sql<{ name: Role }[]>`
    SELECT r.name FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE lower(ur.email) = lower(${email})
    LIMIT 1
  `;
  return rows[0]?.name ?? "viewer";
}

export async function requireRole(...allowed: Role[]): Promise<Role> {
  const role = await getCurrentRole();
  if (!allowed.includes(role)) {
    throw new Error("คุณไม่มีสิทธิ์ดำเนินการนี้");
  }
  return role;
}

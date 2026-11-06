import { redirect } from "next/navigation";
import sql from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { getCurrentRole, type Role } from "@/lib/roles";
import { ALL_MENU_KEYS, MENU_HOME, MENU_OPTIONS, type MenuKey } from "@/lib/menu-config";

export async function getCurrentUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email?.trim().toLowerCase() ?? null;
}

export async function getAllowedMenus(role?: Role): Promise<MenuKey[]> {
  const currentRole = role ?? await getCurrentRole();
  if (currentRole === "admin") return ALL_MENU_KEYS;

  const email = await getCurrentUserEmail();
  if (!email) return [];

  // Only enabled users listed in `users` get menus; Admin keeps every menu.
  const [access] = await sql<{ menu_keys: string[] }[]>`
    SELECT menu_keys FROM users WHERE lower(email) = ${email} AND is_active LIMIT 1
  `;
  if (!access) return [];
  return access.menu_keys.filter((key): key is MenuKey => ALL_MENU_KEYS.includes(key as MenuKey));
}

// First menu (in sidebar order) the user can open, or null when they have none.
export function homePathFor(menus: MenuKey[]): string | null {
  const first = MENU_OPTIONS.find((menu) => menus.includes(menu.key));
  return first ? MENU_HOME[first.key] : null;
}

// Where to send someone right after signing in: Admin keeps Sales Admin, Viewer lands on
// the first menu they can view.
export async function getLandingPath(email: string): Promise<string> {
  const [user] = await sql<{ role: Role; menu_keys: string[] }[]>`
    SELECT role, menu_keys FROM users WHERE lower(email) = ${email.toLowerCase()} AND is_active LIMIT 1
  `;
  if (!user) return "/dashboard";
  if (user.role === "admin") return "/sales-admin";
  const menus = user.menu_keys.filter((key): key is MenuKey => ALL_MENU_KEYS.includes(key as MenuKey));
  return homePathFor(menus) ?? "/dashboard";
}

export async function requireMenuAccess(menuKey: MenuKey) {
  const role = await getCurrentRole();
  if (role === "admin") return;

  const allowedMenus = await getAllowedMenus(role);
  if (!allowedMenus.includes(menuKey)) redirect("/dashboard?access=denied");
}

export async function getSidebarAccess() {
  const role = await getCurrentRole();
  return { role, allowedMenus: await getAllowedMenus(role) };
}

import Sidebar from "@/components/Sidebar";
import { getSidebarAccess } from "@/lib/menu-access";

// Pages here read live data from the database; don't prerender them at build time.
export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { role, allowedMenus } = await getSidebarAccess();

  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <Sidebar allowedMenus={allowedMenus} isAdmin={role === "admin"} />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

import Sidebar from "@/components/Sidebar";

// Pages here read live data from the database; don't prerender them at build time.
export const dynamic = "force-dynamic";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-auto">
        <div className="p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}

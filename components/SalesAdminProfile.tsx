import Link from "next/link";
import { notFound } from "next/navigation";
import { getEmployeeProfile } from "@/lib/actions/org-chart";
import { getInitials, displayName } from "./org-avatar-utils";

interface SalesAdminProfileProps {
  id: number;
  teamTag: string;
  teamHref: string;
}

export default async function SalesAdminProfile({ id, teamTag, teamHref }: SalesAdminProfileProps) {
  const employee = await getEmployeeProfile(id);
  if (!employee) notFound();

  return (
    <div className="max-w-2xl">
      <nav className="mb-5 flex items-center gap-1.5 text-sm text-gray-400">
        <Link href="/dashboard" className="hover:text-[#102E5A]">Home</Link>
        <span>›</span>
        <Link href={teamHref} className="hover:text-[#102E5A]">{teamTag}</Link>
        <span>›</span>
        <span className="text-gray-600">{employee.name}</span>
      </nav>

      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#102E5A] text-lg font-semibold uppercase text-white"
            style={employee.photo_url ? { backgroundImage: `url(${employee.photo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
          >
            {!employee.photo_url && getInitials(employee.name, employee.nickname)}
          </div>

          <div className="min-w-0">
            <p className="text-lg font-semibold text-gray-900">{displayName(employee.name, employee.nickname)}</p>
            <p className="text-sm text-gray-500">{employee.position_name ?? "—"}</p>

            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <a href={`tel:${employee.phone}`} className="flex items-center gap-1.5 text-sm text-[#102E5A]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                {employee.phone ?? "—"}
              </a>
              <a href={`mailto:${employee.email}`} className="flex items-center gap-1.5 text-sm text-[#102E5A]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                </svg>
                {employee.email ?? "—"}
              </a>
              <span className="inline-flex items-center gap-1 rounded-full border border-[#102E5A]/25 px-2.5 py-0.5 text-xs font-medium text-[#102E5A]">
                {teamTag}
              </span>
            </div>
          </div>
        </div>

        <hr className="my-5 border-gray-100" />

        <h2 className="mb-3 text-sm font-semibold text-gray-900">ความรับผิดชอบหลัก</h2>
        {employee.responsibilities && employee.responsibilities.length > 0 ? (
          <ul className="space-y-2">
            {employee.responsibilities.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                <svg className="mt-0.5 w-4 h-4 shrink-0 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-400">ยังไม่ได้ระบุขอบเขตงาน</p>
        )}
      </div>
    </div>
  );
}

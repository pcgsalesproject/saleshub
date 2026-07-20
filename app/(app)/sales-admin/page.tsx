import Link from "next/link";

const teams = [
  {
    label: "Admin TT",
    href: "/sales-admin/tt",
    members: 12,
    description: "Support Traditional Trade sales operations and daily activities.",
    iconWrap: "bg-blue-100 text-blue-600",
  },
  {
    label: "Admin MT",
    href: "/sales-admin/mt",
    members: 9,
    description: "Support Modern Trade sales operations and daily activities.",
    iconWrap: "bg-green-100 text-green-600",
  },
  {
    label: "Admin CLM",
    href: "/sales-admin/clm",
    members: 10,
    description: "Support CLM sales operations, contracts and claims activities.",
    iconWrap: "bg-purple-100 text-purple-600",
  },
  {
    label: "System Admin",
    href: "/sales-admin/system",
    members: 5,
    description: "Manage systems, IT infrastructure and user support.",
    iconWrap: "bg-orange-100 text-orange-500",
  },
];

function TeamIcon({ label, className }: { label: string; className: string }) {
  if (label === "System Admin") {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M11.078 2.25c-.917 0-1.699.663-1.85 1.567l-.091.549a.798.798 0 01-.517.608 7.45 7.45 0 00-.478.198.798.798 0 01-.796-.064l-.453-.324a1.875 1.875 0 00-2.416.196l-.415.415a1.875 1.875 0 00-.196 2.416l.324.453a.798.798 0 01.064.796 7.448 7.448 0 00-.198.478.798.798 0 01-.608.517l-.55.092a1.875 1.875 0 00-1.566 1.849v.586c0 .917.663 1.699 1.567 1.85l.549.091c.281.047.508.256.608.517.06.162.127.321.198.478a.798.798 0 01-.064.796l-.324.453a1.875 1.875 0 00.196 2.416l.415.415c.667.667 1.73.74 2.416.196l.453-.324a.798.798 0 01.796-.064c.157.071.316.137.478.198.261.1.47.327.517.608l.092.55c.15.903.932 1.566 1.849 1.566h.586c.917 0 1.699-.663 1.85-1.567l.091-.549a.798.798 0 01.517-.608 7.52 7.52 0 00.478-.198.798.798 0 01.796.064l.453.324a1.875 1.875 0 002.416-.196l.415-.415a1.875 1.875 0 00.196-2.416l-.324-.453a.798.798 0 01-.064-.796c.071-.157.137-.316.198-.478.1-.261.327-.47.608-.517l.55-.091a1.875 1.875 0 001.566-1.85v-.586c0-.917-.663-1.699-1.567-1.85l-.549-.091a.798.798 0 01-.608-.517 7.507 7.507 0 00-.198-.478.798.798 0 01.064-.796l.324-.453a1.875 1.875 0 00-.196-2.416l-.415-.415a1.875 1.875 0 00-2.416-.196l-.453.324a.798.798 0 01-.796.064 7.462 7.462 0 00-.478-.198.798.798 0 01-.517-.608l-.091-.55a1.875 1.875 0 00-1.85-1.566h-.586zM12 15.75a3.75 3.75 0 100-7.5 3.75 3.75 0 000 7.5z"
        />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />
    </svg>
  );
}

export default function SalesAdminPage() {
  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-blue-50/60 to-white px-8 py-10 mb-8">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-blue-100/60 blur-2xl" />
        <div className="pointer-events-none absolute right-8 bottom-0 h-32 w-32 rounded-full bg-[#102E5A]/10 blur-xl" />

        <div className="relative">
          <p className="text-base font-medium text-gray-500">Welcome to</p>
          <h1 className="mt-1 text-6xl font-bold tracking-tight text-[#102E5A] whitespace-nowrap">Sales Admin Department</h1>
          <p className="mt-2 max-w-lg text-base text-gray-500">We support sales teams to drive our business forward.</p>
        </div>
      </div>

      <h2 className="text-base font-semibold text-gray-900 mb-4">Our Teams</h2>

      <div className="grid grid-cols-4 gap-5">
        {teams.map((team) => (
          <div
            key={team.label}
            className="flex flex-col rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className={`flex h-12 w-12 items-center justify-center rounded-full ${team.iconWrap}`}>
              <TeamIcon label={team.label} className="w-6 h-6" />
            </div>

            <p className="mt-4 text-sm font-semibold text-[#102E5A]">{team.label}</p>
            <p className="text-xs font-medium text-gray-400">{team.members} Members</p>
            <p className="mt-2 text-sm leading-relaxed text-gray-500 flex-1">{team.description}</p>

            <Link
              href={team.href}
              className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-[#102E5A] hover:bg-[#102E5A]/5 hover:border-[#102E5A]/30 transition-colors"
            >
              View Team
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        ))}
      </div>

      <Link
        href="/sales-admin/org-chart"
        className="mt-5 mx-auto flex max-w-xs items-center justify-center gap-2 rounded-2xl border border-gray-100 bg-white p-3 text-sm font-medium text-[#102E5A] shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v6m0 0H6a2 2 0 00-2 2v2m8-4h6a2 2 0 012 2v2M6 17h.01M12 17h.01M18 17h.01M4 13h16v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
        </svg>
        ดูผังโครงสร้างองค์กร
      </Link>
    </div>
  );
}

import Link from "next/link";

interface Item {
  title: string;
  description: string;
  icon: string;
  href?: string; // no href = not built yet
  tone?: string;
}

const ICONS = {
  users: "M15 19.1a6 6 0 0 0-12 0M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm12 8.1a6 6 0 0 0-4.5-5.8M16 3.2a4 4 0 0 1 0 7.6",
  userPlus: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2m7-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm9-1v6m3-3h-6",
  shield: "M12 3 4 6v6c0 4.5 3.2 8.2 8 9 4.8-.8 8-4.5 8-9V6l-8-3Zm-3 9 2 2 4-4",
  clock: "M12 7v5l3 2m6-2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  lock: "M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z",
  bolt: "M13 2 4 14h7l-1 8 9-12h-7l1-8Z",
  refresh: "M4 12a8 8 0 0 1 14-5.3L20 9m0-5v5h-5m5 3a8 8 0 0 1-14 5.3L4 15m0 5v-5h5",
  file: "M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8l-5-5Zm0 0v5h5M9 13h6m-6 4h4",
  gear: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-2a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1Z",
};

function Icon({ d, className = "h-5 w-5" }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  );
}

const USER_ACCESS: Item[] = [
  { title: "User Management", description: "Create, edit and manage user accounts", icon: ICONS.users, href: "/settings/users" },
  { title: "Role & Permissions", description: "Configure roles and access permissions", icon: ICONS.shield },
  { title: "Activity Logs", description: "View system activity and user logs", icon: ICONS.clock },
];

const SECURITY: Item[] = [
  { title: "Audit & Compliance", description: "Security audit and compliance settings", icon: ICONS.shield },
];

const QUICK_ACTIONS: Item[] = [
  { title: "Add User", description: "Create a new user account", icon: ICONS.userPlus, href: "/settings/users/new", tone: "bg-blue-50 text-blue-600" },
  { title: "Create Role", description: "Define a new role with permissions", icon: ICONS.shield, tone: "bg-purple-50 text-purple-600" },
  { title: "Reset Access", description: "Reset user access permissions", icon: ICONS.refresh, tone: "bg-green-50 text-green-600" },
  { title: "View Logs", description: "Check system activity logs", icon: ICONS.file, tone: "bg-amber-50 text-amber-600" },
];

function SoonBadge() {
  return <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">เร็วๆ นี้</span>;
}

function Row({ item, quick = false }: { item: Item; quick?: boolean }) {
  const body = (
    <>
      <span className={`flex shrink-0 items-center justify-center ${quick ? `h-10 w-10 rounded-full ${item.tone}` : "h-10 w-10 text-[#1d4ed8]"}`}>
        <Icon d={item.icon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-gray-900">{item.title}</span>
        <span className="block text-xs text-gray-500">{item.description}</span>
      </span>
      {item.href ? (
        <span className="text-gray-400" aria-hidden>{quick ? "→" : "›"}</span>
      ) : (
        <SoonBadge />
      )}
    </>
  );
  const cls = "flex items-center gap-3 border-b border-gray-100 px-2 py-3 last:border-b-0";
  return item.href ? (
    <Link href={item.href} className={`${cls} rounded-lg hover:bg-gray-50`}>{body}</Link>
  ) : (
    <div className={`${cls} opacity-60`}>{body}</div>
  );
}

function SectionTitle({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div className="mb-2 flex items-start gap-3">
      <span className="mt-0.5 text-[#1d4ed8]"><Icon d={icon} className="h-6 w-6" /></span>
      <div>
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-4 rounded-2xl bg-blue-50 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-5">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-white text-[#2563eb] shadow-sm">
            <Icon d={ICONS.gear} className="h-9 w-9" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-[#102E5A]">System Overview</h1>
            <p className="mt-1 text-sm text-gray-600">
              Manage your organization&apos;s users, roles and access permissions.<br />
              Keep your data secure and efficient.
            </p>
          </div>
        </div>
        <Link href="/settings/users" className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1d4ed8]">
          <Icon d={ICONS.gear} className="h-4 w-4" />
          Manage Settings
        </Link>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-5">
          <div>
            <SectionTitle icon={ICONS.users} title="User Access" subtitle="Manage user accounts and their permissions" />
            {USER_ACCESS.map((item) => <Row key={item.title} item={item} />)}
          </div>
          <div className="border-t border-gray-100 pt-5">
            <SectionTitle icon={ICONS.lock} title="System & Security" subtitle="Security and system configuration" />
            {SECURITY.map((item) => <Row key={item.title} item={item} />)}
          </div>
        </div>

        <div className="self-start rounded-2xl border border-gray-200 bg-blue-50/50 p-5">
          <SectionTitle icon={ICONS.bolt} title="Quick Actions" subtitle="Common tasks and shortcuts" />
          <div className="rounded-xl bg-white p-2">
            {QUICK_ACTIONS.map((item) => <Row key={item.title} item={item} quick />)}
          </div>
        </div>
      </div>
    </div>
  );
}

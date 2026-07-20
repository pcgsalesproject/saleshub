"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { logout } from "@/app/login/actions";

const navItems = [
  {
    label: "Sales Admin",
    overviewHref: "/sales-admin",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0115 18.257V17.25m6-12V15a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 15V5.25m18 0A2.25 2.25 0 0018.75 3H5.25A2.25 2.25 0 003 5.25m18 0V12a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 12V5.25" />
      </svg>
    ),
    children: [
      { label: "Admin TT", href: "/sales-admin/tt" },
      { label: "Admin CLM", href: "/sales-admin/clm" },
      { label: "System Admin", href: "/sales-admin/system" },
      { label: "Admin MT", href: "/sales-admin/mt" },
    ],
  },
  {
    label: "Employee",
    overviewHref: "/employees",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-3.87M9 20H4v-2a4 4 0 015-3.87m6-4a4 4 0 11-8 0 4 4 0 018 0zm6 4a2 2 0 100-4 2 2 0 000 4zm-12 0a2 2 0 100-4 2 2 0 000 4z" />
      </svg>
    ),
    children: [
      { label: "Employee Information", href: "/employees/information" },
    ],
  },
  {
    label: "Assets",
    overviewHref: "/assets",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    children: [
      { label: "Asset List", href: "/assets" },
      { label: "Asset Assignments", href: "/assignments" },
      { label: "Asset Records", href: "/asset-history" },
      { label: "Asset Inspection", href: "/inspection/new" },
      { label: "Inspection Summary", href: "/inspection/summary" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const isChildActive = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const [openGroup, setOpenGroup] = useState<string | null>(
    () => navItems.find((item) => item.children.some((c) => isChildActive(c.href)))?.label ?? null
  );

  function toggleGroup(label: string) {
    setOpenGroup((prev) => (prev === label ? null : label));
  }

  return (
    <aside className="flex flex-col w-64 min-h-screen bg-[#102E5A] text-white">
      <div className="flex flex-col items-center px-4 py-5 border-b border-white/10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sidebar_logo.png" alt="Saleshub" className="w-44 object-contain" />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const open = openGroup === item.label;
          return (
            <div key={item.label}>
              <div
                className={`flex items-center gap-1 rounded-lg text-sm font-medium transition-colors ${
                  open ? "text-white" : "text-white/70"
                } hover:bg-white/10 hover:text-white`}
              >
                <Link
                  href={item.overviewHref}
                  onClick={() => setOpenGroup(item.label)}
                  className="flex items-center gap-3 flex-1 px-3 py-2.5"
                >
                  {item.icon}
                  <span>{item.label}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleGroup(item.label)}
                  aria-label={open ? "Collapse" : "Expand"}
                  className="px-3 py-2.5"
                >
                  <svg
                    className={`w-4 h-4 transition-transform ${open ? "rotate-90" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
              {open && (
                <div className="mt-1 ml-5 space-y-1 border-l border-white/10 pl-3">
                  {item.children.map((child) => {
                    const active = isChildActive(child.href);
                    return (
                      <Link
                        key={child.href}
                        href={child.href}
                        className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? "bg-white/15 text-white"
                            : "text-white/70 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/10 space-y-3">
        <form
          action={logout}
          onSubmit={() => {
            if (typeof caches !== "undefined") {
              caches.keys().then((keys) => keys.forEach((key) => caches.delete(key)));
            }
          }}
        >
          <button
            type="submit"
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            ออกจากระบบ
          </button>
        </form>
        <p className="text-xs text-white/40 text-center">© 2026 PCG Sales Hub</p>
      </div>
    </aside>
  );
}

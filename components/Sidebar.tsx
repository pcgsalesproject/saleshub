"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logout } from "@/app/login/actions";

const COLLAPSE_KEY = "sh-sidebar-collapsed";

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
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // Read the persisted preference after mount only: localStorage isn't
    // available during SSR, so syncing here (once) avoids a hydration
    // mismatch that an SSR-unsafe lazy initializer would cause.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
  }, []);

  function toggleGroup(label: string) {
    setOpenGroup((prev) => (prev === label ? null : label));
  }

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      return next;
    });
  }

  return (
    <aside
      className={`relative flex flex-col min-h-screen bg-[#102E5A] text-white transition-[width] duration-200 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      <button
        type="button"
        onClick={toggleCollapsed}
        aria-label={collapsed ? "ขยายเมนู" : "ย่อเมนู"}
        className="absolute -right-3 top-8 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#102E5A] shadow-md hover:bg-gray-100 transition-colors z-10"
      >
        <svg
          className={`w-3.5 h-3.5 transition-transform ${collapsed ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth={2.5}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div className="flex flex-col items-center px-4 py-5 border-b border-white/10 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/sidebar_logo.png"
          alt="Saleshub"
          className={`object-contain transition-all duration-200 ${collapsed ? "w-8" : "w-44"}`}
        />
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const open = openGroup === item.label;
          return (
            <div key={item.label}>
              <div
                title={collapsed ? item.label : undefined}
                className={`flex items-center gap-1 rounded-lg text-sm font-medium transition-colors ${
                  open ? "text-white" : "text-white/70"
                } hover:bg-white/10 hover:text-white`}
              >
                <Link
                  href={item.overviewHref}
                  onClick={() => setOpenGroup(item.label)}
                  className={`flex items-center gap-3 flex-1 px-3 py-2.5 ${collapsed ? "justify-center" : ""}`}
                >
                  {item.icon}
                  {!collapsed && <span>{item.label}</span>}
                </Link>
                {!collapsed && (
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
                )}
              </div>
              {open && !collapsed && (
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
            title={collapsed ? "ออกจากระบบ" : undefined}
            className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-white/60 hover:bg-white/10 hover:text-white transition-colors ${
              collapsed ? "justify-center" : ""
            }`}
          >
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
            {!collapsed && "ออกจากระบบ"}
          </button>
        </form>
        {!collapsed && <p className="text-xs text-white/40 text-center">© 2026 PCG Sales Hub</p>}
      </div>
    </aside>
  );
}

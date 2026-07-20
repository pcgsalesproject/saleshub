"use client";

import { useState } from "react";
import Link from "next/link";
import s from "./TeamRoster.module.css";
import { getInitials, displayName } from "./org-avatar-utils";
import type { OrgChartEmployee } from "@/lib/types";

interface ScopeGroup {
  category: string;
  items: string[];
}

interface TeamRosterProps {
  title: string;
  subtitle: string;
  teamHref: string;
  scope?: ScopeGroup[];
  members: OrgChartEmployee[];
}

const SCOPE_ICON_PATHS = [
  "M2.25 3h1.386c.51 0 .955.343 1.087.836l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 1.994-4.706 2.593-7.193.121-.5-.106-1.028-.6-1.164A48.507 48.507 0 0012 2.25a48.51 48.51 0 00-6.24.394c-.494.135-.72.664-.6 1.164.598 2.487 1.471 4.893 2.593 7.192zM8.25 18.75a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zm11.25 0a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z",
  "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-1.019-3.019L15 15.75m-6.75-9V21m0-15.75h3.75m-3.75 0a1.5 1.5 0 00-1.5 1.5v12.75a1.5 1.5 0 001.5 1.5h9a1.5 1.5 0 001.5-1.5V9",
  "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
  "M10.34 15.84c-.688-.06-1.386-.09-2.09-.09H7.5a4.5 4.5 0 110-9h.75c.704 0 1.402-.03 2.09-.09m0 9.18c.253.962.584 1.892.985 2.783.247.55.06 1.21-.463 1.511l-.657.38c-.551.318-1.26.117-1.527-.461a20.845 20.845 0 01-1.44-4.282m3.102.069a18.03 18.03 0 01-.59-4.59c0-1.586.205-3.124.59-4.59m0 9.18a23.848 23.848 0 018.835 2.535M10.34 6.66a23.847 23.847 0 008.835-2.535m0 0A23.74 23.74 0 0018.795 3m.38 1.125a23.91 23.91 0 011.014 5.395m-1.014 8.855c-.118.38-.245.754-.38 1.125m.38-1.125a23.91 23.91 0 001.014-5.395m0-3.46c.495.413.811 1.035.811 1.73 0 .695-.316 1.317-.811 1.73m0-3.46a24.347 24.347 0 010 3.46",
  "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
];

const SCOPE_ICON_COLOR_CLASSES = ["scopeIconBlue", "scopeIconOrange", "scopeIconPurple", "scopeIconTeal", "scopeIconGray"] as const;

function ScopeIcon({ index }: { index: number }) {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d={SCOPE_ICON_PATHS[index % SCOPE_ICON_PATHS.length]} />
    </svg>
  );
}

function Avatar({ member, className }: { member: OrgChartEmployee; className: string }) {
  return (
    <div
      className={className}
      style={member.photo_url ? { backgroundImage: `url(${member.photo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
    >
      {!member.photo_url && getInitials(member.name, member.nickname).toUpperCase()}
    </div>
  );
}

export default function TeamRoster({ title, subtitle, teamHref, scope, members }: TeamRosterProps) {
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [tab, setTab] = useState<"members" | "scope">("members");
  const hasScope = !!scope && scope.length > 0;

  const positions = Array.from(new Set(members.map((m) => m.position_name).filter(Boolean))) as string[];

  const filtered = members.filter((m) => {
    const matchesSearch = m.name.toLowerCase().includes(search.trim().toLowerCase());
    const matchesPosition = !position || m.position_name === position;
    return matchesSearch && matchesPosition;
  });

  return (
    <div>
      <div className={s.banner}>
        <h1 className={s.bannerTitle}>{title}</h1>
        <p className={s.bannerSubtitle}>{subtitle}</p>
      </div>

      {hasScope && (
        <div className={s.tabBar}>
          <button
            type="button"
            onClick={() => setTab("members")}
            className={`${s.tabButton} ${tab === "members" ? s.tabButtonActive : ""}`}
          >
            สมาชิก
          </button>
          <button
            type="button"
            onClick={() => setTab("scope")}
            className={`${s.tabButton} ${tab === "scope" ? s.tabButtonActive : ""}`}
          >
            ขอบเขตงาน
          </button>
        </div>
      )}

      {hasScope && tab === "scope" ? (
        <div className={s.scopeBox}>
          <div className={s.scopeHeader}>
            <svg className={s.scopeHeaderIcon} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            หน้าที่และความรับผิดชอบหลัก (Key Responsibilities)
          </div>

          <div className={s.scopeGroups}>
            {scope!.map((group, i) => (
              <div key={group.category} className={s.scopeGroup}>
                <div className={`${s.scopeIcon} ${s[SCOPE_ICON_COLOR_CLASSES[i % SCOPE_ICON_COLOR_CLASSES.length]]}`}>
                  <ScopeIcon index={i} />
                </div>
                <div className={s.scopeGroupBody}>
                  <p className={s.scopeCategory}>{i + 1}. {group.category}</p>
                  <ul className={s.scopeList}>
                    {group.items.map((item) => (
                      <li key={item} className={s.scopeItem}>
                        <span className={s.scopeDot} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
      <div className={s.filterRow}>
        <div className={s.searchWrap}>
          <svg className={s.searchIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search employee..."
            className={s.searchInput}
          />
        </div>

        <select value={position} onChange={(e) => setPosition(e.target.value)} className={s.filterSelect}>
          <option value="">All Position</option>
          {positions.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>

        <div className={s.viewToggle}>
          <button
            type="button"
            onClick={() => setView("grid")}
            className={`${s.viewButton} ${view === "grid" ? s.viewButtonActive : ""}`}
            aria-label="Grid view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 5h6v6H4V5zm10 0h6v6h-6V5zM4 15h6v6H4v-6zm10 0h6v6h-6v-6z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setView("list")}
            className={`${s.viewButton} ${view === "list" ? s.viewButtonActive : ""}`}
            aria-label="List view"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-sm text-gray-400">ไม่พบพนักงาน</p>
      ) : view === "grid" ? (
        <div className={s.grid}>
          {filtered.map((m) => (
            <div key={m.id} className={s.card}>
              <div className={s.cardTop}>
                <Avatar member={m} className={s.avatar} />
                <p className={s.name}>{displayName(m.name, m.nickname)}</p>
                <p className={s.position}>{m.position_name ?? "—"}</p>
              </div>

              <hr className={s.divider} />

              <div className={s.cardInfo}>
                <div className={s.infoRow}>
                  <svg className={s.infoIcon} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                  <span>{m.phone ?? "—"}</span>
                </div>
                <div className={s.infoRow}>
                  <svg className={s.infoIcon} fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                  </svg>
                  <span className="truncate">{m.email ?? "—"}</span>
                </div>
              </div>

              {m.responsibilities && m.responsibilities.length > 0 && (
                <>
                  <hr className={s.divider} />
                  <div>
                    <p className={s.jobTitle}>ความรับผิดชอบหลัก</p>
                    <ul className={s.jobList}>
                      {m.responsibilities.map((item) => (
                        <li key={item} className={s.jobItem}>
                          <svg className={s.jobIcon} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}

              <Link href={`${teamHref}/${m.id}`} className={s.viewProfile}>
                View Profile
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className={s.list}>
          {filtered.map((m) => (
            <div key={m.id} className={s.listRow}>
              <Avatar member={m} className={s.listAvatar} />
              <div className={s.listIdentity}>
                <p className={s.name}>{displayName(m.name, m.nickname)}</p>
                <p className={s.position}>{m.position_name ?? "—"}</p>
              </div>
              <div className={s.listInfo}>
                <span className={s.position}>{m.phone ?? "—"}</span>
                <span className={s.position}>{m.email ?? "—"}</span>
              </div>
              <Link href={`${teamHref}/${m.id}`} className={s.viewProfile}>
                View Profile
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>
          ))}
        </div>
      )}
        </>
      )}
    </div>
  );
}

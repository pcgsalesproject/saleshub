"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import OrgChartTreeLoader from "./OrgChartTreeLoader";
import { DND_MIME } from "./OrgNode";
import { assignEmployeeToNode, unassignNode } from "@/lib/actions/org-chart";
import { getInitials, displayName } from "./org-avatar-utils";
import type { OrgChartEmployee, OrgChartNode } from "@/lib/types";

interface OrgChartBuilderProps {
  root: OrgChartNode;
  employees: OrgChartEmployee[];
  isAdmin: boolean;
}

export default function OrgChartBuilder({ root, employees, isAdmin }: OrgChartBuilderProps) {
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const filtered = employees.filter((emp) =>
    emp.name.toLowerCase().includes(search.trim().toLowerCase())
  );

  function handleAssign(nodeId: number, employeeId: number) {
    setError(null);
    startTransition(async () => {
      const result = await assignEmployeeToNode(nodeId, employeeId);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  function handleUnassign(nodeId: number) {
    setError(null);
    startTransition(async () => {
      const result = await unassignNode(nodeId);
      if (!result.ok) setError(result.error);
      router.refresh();
    });
  }

  if (!isAdmin) {
    return (
      <OrgChartTreeLoader root={root} editable={false} onAssign={() => {}} onUnassign={() => {}} />
    );
  }

  return (
    <div className="flex gap-6 items-start">
      <aside className="w-64 shrink-0 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <p className="text-sm font-semibold text-gray-900 mb-3">รายชื่อพนักงาน</p>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ค้นหาพนักงาน..."
          className="input mb-3 text-sm"
        />
        <div className="flex flex-col gap-2 max-h-[520px] overflow-y-auto">
          {filtered.map((emp) => (
            <div
              key={emp.id}
              draggable
              onDragStart={(e) => e.dataTransfer.setData(DND_MIME, String(emp.id))}
              className="flex items-center gap-2.5 rounded-lg border border-gray-100 bg-white px-2.5 py-2 text-sm cursor-grab active:cursor-grabbing hover:border-[#102E5A]/30 hover:bg-gray-50 transition-colors"
            >
              <div
                className="org-avatar"
                style={
                  emp.photo_url
                    ? { width: 28, height: 28, fontSize: 11, backgroundImage: `url(${emp.photo_url})`, backgroundSize: "cover", backgroundPosition: "center" }
                    : { width: 28, height: 28, fontSize: 11 }
                }
              >
                {!emp.photo_url && getInitials(emp.name, emp.nickname)}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-gray-900">{displayName(emp.name, emp.nickname)}</p>
                <p className="truncate text-xs text-gray-400">{emp.position_name ?? "—"}</p>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <p className="py-6 text-center text-xs text-gray-400">ไม่พบพนักงาน</p>
          )}
        </div>
      </aside>

      <div className="flex-1 overflow-x-auto">
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <OrgChartTreeLoader root={root} editable onAssign={handleAssign} onUnassign={handleUnassign} />
      </div>
    </div>
  );
}

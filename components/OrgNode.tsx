"use client";

import { useState } from "react";
import { getInitials, displayName } from "./org-avatar-utils";
import type { OrgChartEmployee, OrgChartNode } from "@/lib/types";

const DND_MIME = "application/x-orgchart-employee-id";

interface OrgNodeProps {
  node: OrgChartNode;
  editable: boolean;
  onAssign?: (nodeId: number, employeeId: number) => void;
  onUnassign?: (nodeId: number) => void;
}

function variantOf(node: OrgChartNode): "exec" | "lead" | "member" | "vacant" {
  if (node.is_exec) return "exec";
  if (node.tag) return "lead";
  const hasSomeone = node.members ? node.members.some((m) => m.employee) : !!node.employee;
  return hasSomeone ? "member" : "vacant";
}

function PersonSlot({
  nodeId,
  employee,
  note,
  editable,
  onAssign,
  onUnassign,
}: {
  nodeId: number;
  employee: OrgChartEmployee | null;
  note: string | null;
  editable: boolean;
  onAssign?: (nodeId: number, employeeId: number) => void;
  onUnassign?: (nodeId: number) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    if (!editable) return;
    const employeeId = Number(e.dataTransfer.getData(DND_MIME));
    if (employeeId) onAssign?.(nodeId, employeeId);
  }

  return (
    <div
      className={`org-person ${!employee ? "pending" : ""} ${dragOver ? "drag-over" : ""}`}
      onDragOver={(e) => {
        if (!editable) return;
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
    >
      {editable && employee && (
        <button
          type="button"
          onClick={() => onUnassign?.(nodeId)}
          className="org-node-remove"
          aria-label="นำออกจากตำแหน่งนี้"
        >
          ×
        </button>
      )}
      <div
        className="org-avatar"
        style={employee?.photo_url ? { backgroundImage: `url(${employee.photo_url})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      >
        {employee && !employee.photo_url && getInitials(employee.name, employee.nickname)}
      </div>
      {employee ? (
        <>
          <p className="org-name">{displayName(employee.name, employee.nickname)}</p>
          <p className="org-title">
            {employee.position_name}
            {note && ` (${note})`}
          </p>
        </>
      ) : (
        <>
          <p className="org-name org-vacant">(ว่าง)</p>
          {(note || editable) && <p className="org-title">{note ?? "ลากพนักงานมาวางที่นี่"}</p>}
        </>
      )}
    </div>
  );
}

export default function OrgNode({ node, editable, onAssign, onUnassign }: OrgNodeProps) {
  const variant = variantOf(node);

  if (node.members) {
    return (
      <div className="org-node-wrap">
        {node.tag && <div className="org-team-tag">{node.tag}</div>}
        <div className={`org-node-pair ${variant}`}>
          {node.members.map((member, i) => (
            <div key={member.nodeId}>
              {i > 0 && <div className="org-node-pair-divider" />}
              <PersonSlot
                nodeId={member.nodeId}
                employee={member.employee}
                note={member.note}
                editable={editable}
                onAssign={onAssign}
                onUnassign={onUnassign}
              />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="org-node-wrap">
      {node.tag && <div className="org-team-tag">{node.tag}</div>}
      <div className={`org-node ${variant}`}>
        <PersonSlot
          nodeId={node.id}
          employee={node.employee}
          note={node.note}
          editable={editable}
          onAssign={onAssign}
          onUnassign={onUnassign}
        />
      </div>
    </div>
  );
}

export { DND_MIME };

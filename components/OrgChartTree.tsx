"use client";

import { Tree, TreeNode } from "react-organizational-chart";
import OrgNode from "./OrgNode";
import type { OrgChartNode } from "@/lib/types";

interface OrgChartTreeProps {
  root: OrgChartNode;
  editable: boolean;
  onAssign: (nodeId: number, employeeId: number) => void;
  onUnassign: (nodeId: number) => void;
}

function renderNode(node: OrgChartNode, editable: boolean, onAssign: OrgChartTreeProps["onAssign"], onUnassign: OrgChartTreeProps["onUnassign"]) {
  return (
    <TreeNode
      key={node.id}
      label={<OrgNode node={node} editable={editable} onAssign={onAssign} onUnassign={onUnassign} />}
    >
      {node.children.map((child) => renderNode(child, editable, onAssign, onUnassign))}
    </TreeNode>
  );
}

export default function OrgChartTree({ root, editable, onAssign, onUnassign }: OrgChartTreeProps) {
  return (
    <div className="orgtree">
      <Tree
        lineWidth="2px"
        lineColor="var(--line)"
        lineBorderRadius="8px"
        label={<OrgNode node={root} editable={editable} onAssign={onAssign} onUnassign={onUnassign} />}
      >
        {root.children.map((child) => renderNode(child, editable, onAssign, onUnassign))}
      </Tree>
    </div>
  );
}

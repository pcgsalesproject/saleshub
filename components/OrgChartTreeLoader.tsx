"use client";

import dynamic from "next/dynamic";
import type { OrgChartNode } from "@/lib/types";

const OrgChartTree = dynamic(() => import("./OrgChartTree"), {
  ssr: false,
  loading: () => <p className="org-title">กำลังโหลดผังโครงสร้าง...</p>,
});

interface OrgChartTreeLoaderProps {
  root: OrgChartNode;
  editable: boolean;
  onAssign: (nodeId: number, employeeId: number) => void;
  onUnassign: (nodeId: number) => void;
}

export default function OrgChartTreeLoader(props: OrgChartTreeLoaderProps) {
  return <OrgChartTree {...props} />;
}

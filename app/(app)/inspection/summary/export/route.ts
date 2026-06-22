import { NextRequest } from "next/server";
import { getInspectionRows, badgeFor } from "@/lib/inspection";

const BADGE_LABEL = {
  ok: "ตรวจแล้ว",
  problem: "พบปัญหา",
  partial: "ตรวจบางส่วน",
  none: "ยังไม่ตรวจ",
} as const;

function csvEscape(value: string) {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const departmentId = searchParams.get("department_id");
  const month = searchParams.get("month") || new Date().toISOString().slice(0, 7);

  const rows = await getInspectionRows(departmentId ? Number(departmentId) : null, month);

  const header = ["รหัสพนักงาน", "ชื่อ-นามสกุล", "ตำแหน่ง", "ฝ่าย", "สถานะ", "พบ", "เสียหาย", "ไม่พบ", "วันที่ตรวจล่าสุด"];
  const lines = [header.join(",")];

  for (const r of rows) {
    lines.push([
      r.id,
      r.name,
      r.position_name ?? "",
      r.department_name ?? "",
      BADGE_LABEL[badgeFor(r)],
      r.found_count,
      r.damaged_count,
      r.missing_count,
      r.last_checked_at ? new Date(r.last_checked_at).toISOString().slice(0, 10) : "",
    ].map((v) => csvEscape(String(v))).join(","));
  }

  const csv = "﻿" + lines.join("\n");

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inspection_${month}.csv"`,
    },
  });
}

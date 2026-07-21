export interface InspectionRow {
  id: number;
  name: string;
  position_name: string | null;
  department_id: number | null;
  department_name: string | null;
  total_assets: number;
  checked_assets: number;
  problem_assets: number;
  found_count: number;
  damaged_count: number;
  missing_count: number;
  last_checked_at: string | null;
}

export type InspectionBadge = "ok" | "problem" | "partial" | "none";

export function badgeFor(row: InspectionRow): InspectionBadge {
  if (row.checked_assets === 0) return "none";
  if (row.problem_assets > 0) return "problem";
  if (row.checked_assets < row.total_assets) return "partial";
  return "ok";
}

export interface RoundHistoryRow {
  round_id: number;
  round_name: string;
  round_year: number;
  round_status: "open" | "closed";
  checked_assets: number;
  problem_assets: number;
  last_checked_at: string | null;
}

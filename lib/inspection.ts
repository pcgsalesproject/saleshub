import sql from "@/lib/db";

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

export async function getInspectionRows(departmentId: number | null, roundId: number | null): Promise<InspectionRow[]> {
  return sql<InspectionRow[]>`
    WITH employee_assets AS (
      SELECT e.id AS employee_id, aa.asset_id
      FROM employees e
      LEFT JOIN asset_assignments aa ON aa.employee_id = e.id AND aa.returned_at IS NULL
      WHERE e.is_active = true
        AND (${departmentId}::int IS NULL OR e.department_id = ${departmentId})
    ),
    totals AS (
      SELECT employee_id, COUNT(asset_id)::int AS total_assets
      FROM employee_assets
      GROUP BY employee_id
    ),
    year_checks AS (
      SELECT ea.employee_id, ac.asset_id, ac.status, ac.checked_at
      FROM employee_assets ea
      JOIN asset_checks ac ON ac.asset_id = ea.asset_id
      WHERE ac.round_id = ${roundId}
    ),
    latest_per_asset AS (
      SELECT DISTINCT ON (employee_id, asset_id) employee_id, asset_id, status, checked_at
      FROM year_checks
      ORDER BY employee_id, asset_id, checked_at DESC
    ),
    agg AS (
      SELECT employee_id,
        COUNT(*)::int AS checked_assets,
        COUNT(*) FILTER (WHERE status != 'found')::int AS problem_assets,
        COUNT(*) FILTER (WHERE status = 'found')::int AS found_count,
        COUNT(*) FILTER (WHERE status = 'damaged')::int AS damaged_count,
        COUNT(*) FILTER (WHERE status = 'missing')::int AS missing_count,
        MAX(checked_at) AS last_checked_at
      FROM latest_per_asset
      GROUP BY employee_id
    )
    SELECT e.id, TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS name,
      p.position AS position_name, e.department_id, d.name AS department_name,
      t.total_assets,
      COALESCE(a.checked_assets, 0) AS checked_assets,
      COALESCE(a.problem_assets, 0) AS problem_assets,
      COALESCE(a.found_count, 0) AS found_count,
      COALESCE(a.damaged_count, 0) AS damaged_count,
      COALESCE(a.missing_count, 0) AS missing_count,
      a.last_checked_at
    FROM totals t
    JOIN employees e ON e.id = t.employee_id
    LEFT JOIN positions p ON e.position_id = p.id
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN agg a ON a.employee_id = t.employee_id
    ORDER BY e.first_name
  `;
}

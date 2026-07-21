import sql from "@/lib/db";
import type { InspectionRow } from "@/lib/inspection-shared";

export type { InspectionRow, InspectionBadge } from "@/lib/inspection-shared";
export { badgeFor } from "@/lib/inspection-shared";

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
      -- Attribute each check to the employee who was holding the asset at the
      -- time it was checked, using a write-time snapshot (inspection session's
      -- employee_id for batch checks, or asset_checks.holder_employee_id
      -- captured at insert time for ad-hoc single checks) rather than the
      -- current live assignment, so a later transfer never re-attributes it.
      SELECT COALESCE(ins.employee_id, ac.holder_employee_id) AS employee_id, ac.asset_id, ac.status, ac.checked_at
      FROM asset_checks ac
      LEFT JOIN inspection_sessions ins ON ins.id = ac.session_id
      WHERE ac.round_id = ${roundId}
    ),
    latest_per_asset AS (
      SELECT DISTINCT ON (employee_id, asset_id) employee_id, asset_id, status, checked_at
      FROM year_checks
      WHERE employee_id IS NOT NULL
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

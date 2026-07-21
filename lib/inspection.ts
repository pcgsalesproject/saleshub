import sql from "@/lib/db";
import type { InspectionRow, RoundHistoryRow } from "@/lib/inspection-shared";

export type { InspectionRow, InspectionBadge, RoundHistoryRow } from "@/lib/inspection-shared";
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

// Per-round summary of an employee's inspection results, across every round
// they participated in plus the currently open round (even if not yet
// checked), so the "history" card can show what's left to do.
export async function getEmployeeRoundHistory(employeeId: number): Promise<RoundHistoryRow[]> {
  return sql<RoundHistoryRow[]>`
    WITH latest_per_asset AS (
      SELECT DISTINCT ON (ac.round_id, ac.asset_id)
        ac.round_id, ac.asset_id, ac.status, ac.checked_at,
        COALESCE(ins.employee_id, ac.holder_employee_id) AS employee_id
      FROM asset_checks ac
      LEFT JOIN inspection_sessions ins ON ins.id = ac.session_id
      WHERE COALESCE(ins.employee_id, ac.holder_employee_id) = ${employeeId}
      ORDER BY ac.round_id, ac.asset_id, ac.checked_at DESC
    ),
    agg AS (
      SELECT round_id,
        COUNT(*)::int AS checked_assets,
        COUNT(*) FILTER (WHERE status != 'found')::int AS problem_assets,
        MAX(checked_at) AS last_checked_at
      FROM latest_per_asset
      GROUP BY round_id
    )
    SELECT r.id AS round_id, r.name AS round_name, r.year AS round_year, r.status AS round_status,
      COALESCE(a.checked_assets, 0)::int AS checked_assets,
      COALESCE(a.problem_assets, 0)::int AS problem_assets,
      a.last_checked_at
    FROM inspection_rounds r
    LEFT JOIN agg a ON a.round_id = r.id
    WHERE r.status = 'open' OR COALESCE(a.checked_assets, 0) > 0
    ORDER BY r.year DESC
  `;
}

export interface EmployeeBasic {
  id: number;
  name: string;
  employee_id: string | null;
  position_name: string | null;
  department_name: string | null;
}

export async function getEmployeeBasic(id: number): Promise<EmployeeBasic | null> {
  const rows = await sql<EmployeeBasic[]>`
    SELECT e.id, TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS name,
      e.employee_id, p.position AS position_name, d.name AS department_name
    FROM employees e
    LEFT JOIN positions p ON e.position_id = p.id
    LEFT JOIN departments d ON e.department_id = d.id
    WHERE e.id = ${id}
  `;
  return rows[0] ?? null;
}

export interface RoundCheckDetail {
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  asset_type_name: string | null;
  serial_number: string | null;
  status: string;
  comment: string | null;
  checked_at: string;
}

export async function getEmployeeRoundChecks(employeeId: number, roundId: number): Promise<RoundCheckDetail[]> {
  return sql<RoundCheckDetail[]>`
    WITH latest AS (
      SELECT DISTINCT ON (ac.asset_id)
        ac.asset_id, ac.status, ac.comment, ac.checked_at,
        COALESCE(ins.employee_id, ac.holder_employee_id) AS employee_id
      FROM asset_checks ac
      LEFT JOIN inspection_sessions ins ON ins.id = ac.session_id
      WHERE ac.round_id = ${roundId}
        AND COALESCE(ins.employee_id, ac.holder_employee_id) = ${employeeId}
      ORDER BY ac.asset_id, ac.checked_at DESC
    )
    SELECT a.id AS asset_id, a.asset_tag, a.asset_name, at.name AS asset_type_name, a.serial_number,
      l.status, l.comment, l.checked_at
    FROM latest l
    JOIN assets a ON a.id = l.asset_id
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    ORDER BY a.asset_name
  `;
}

export interface RoundBasic {
  id: number;
  name: string;
  year: number;
  status: "open" | "closed";
}

export async function getRoundById(roundId: number): Promise<RoundBasic | null> {
  const rows = await sql<RoundBasic[]>`SELECT id, name, year, status FROM inspection_rounds WHERE id = ${roundId}`;
  return rows[0] ?? null;
}

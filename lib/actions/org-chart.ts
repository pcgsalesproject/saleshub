"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/roles";
import type { OrgChartEmployee, OrgChartNode } from "@/lib/types";

interface NodeRow {
  id: number;
  parent_id: number | null;
  position: number;
  tag: string | null;
  is_exec: boolean;
  note: string | null;
  pair_group: string | null;
  employee_id: number | null;
  employee_name: string | null;
  employee_nickname: string | null;
  employee_photo_url: string | null;
  employee_phone: string | null;
  employee_email: string | null;
  employee_is_active: boolean | null;
  position_name: string | null;
  department_name: string | null;
}

/** Merges consecutive siblings that share a `pair_group` into one box with no connector line between them. */
function mergePairSiblings(node: OrgChartNode, pairGroupById: Map<number, string | null>) {
  const merged: OrgChartNode[] = [];
  let i = 0;

  while (i < node.children.length) {
    const child = node.children[i];
    const group = pairGroupById.get(child.id);

    if (group) {
      const groupNodes = [child];
      let j = i + 1;
      while (j < node.children.length && pairGroupById.get(node.children[j].id) === group) {
        groupNodes.push(node.children[j]);
        j++;
      }

      if (groupNodes.length > 1) {
        merged.push({
          id: groupNodes[0].id,
          parent_id: groupNodes[0].parent_id,
          position: groupNodes[0].position,
          tag: groupNodes.find((n) => n.tag)?.tag ?? null,
          is_exec: false,
          note: null,
          employee: null,
          members: groupNodes.map((n) => ({ nodeId: n.id, employee: n.employee, note: n.note })),
          children: groupNodes.flatMap((n) => n.children),
        });
        i = j;
        continue;
      }
    }

    merged.push(child);
    i++;
  }

  node.children = merged;
  for (const child of node.children) mergePairSiblings(child, pairGroupById);
}

function buildTree(rows: NodeRow[]): OrgChartNode | null {
  const nodes = new Map<number, OrgChartNode>();
  const pairGroupById = new Map<number, string | null>();

  for (const row of rows) {
    pairGroupById.set(row.id, row.pair_group);
    nodes.set(row.id, {
      id: row.id,
      parent_id: row.parent_id,
      position: row.position,
      tag: row.tag,
      is_exec: row.is_exec,
      note: row.note,
      employee: row.employee_id
        ? {
            id: row.employee_id,
            name: row.employee_name!,
            nickname: row.employee_nickname,
            photo_url: row.employee_photo_url,
            position_name: row.position_name,
            department_name: row.department_name,
            phone: row.employee_phone,
            email: row.employee_email,
            is_active: row.employee_is_active ?? true,
            responsibilities: null,
          }
        : null,
      children: [],
    });
  }

  let root: OrgChartNode | null = null;
  for (const node of nodes.values()) {
    if (node.parent_id === null) {
      root = node;
    } else {
      nodes.get(node.parent_id)?.children.push(node);
    }
  }

  for (const node of nodes.values()) {
    node.children.sort((a, b) => a.position - b.position || a.id - b.id);
  }

  if (root) mergePairSiblings(root, pairGroupById);

  return root;
}

export async function getOrgChartTree(chartKey = "sales-admin"): Promise<OrgChartNode | null> {
  const rows = await sql<NodeRow[]>`
    SELECT
      n.id, n.parent_id, n.position, n.tag, n.is_exec, n.note, n.pair_group,
      e.id AS employee_id,
      TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) AS employee_name,
      e.nickname AS employee_nickname,
      e.photo_url AS employee_photo_url,
      e.phone AS employee_phone,
      e.email AS employee_email,
      e.is_active AS employee_is_active,
      p.position AS position_name,
      d.name AS department_name
    FROM org_chart_nodes n
    LEFT JOIN employees e ON e.id = n.employee_id
    LEFT JOIN positions p ON p.id = e.position_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE n.chart_key = ${chartKey}
    ORDER BY n.position, n.id
  `;

  return buildTree(rows);
}

interface EmployeeRow {
  id: number;
  name: string;
  nickname: string | null;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  position_name: string | null;
  department_name: string | null;
}

export async function getAssignableEmployees(): Promise<OrgChartEmployee[]> {
  const rows = await sql<EmployeeRow[]>`
    SELECT
      e.id,
      TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) AS name,
      e.nickname,
      e.photo_url,
      e.phone,
      e.email,
      e.is_active,
      p.position AS position_name,
      d.name AS department_name
    FROM employees e
    LEFT JOIN positions p ON p.id = e.position_id
    LEFT JOIN departments d ON d.id = e.department_id
    WHERE e.is_active = true
    ORDER BY e.first_name, e.last_name
  `;
  return rows.map((row) => ({ ...row, responsibilities: null }));
}

interface TeamMemberRow extends EmployeeRow {
  responsibilities: string[] | null;
}

export async function getTeamMembers(tag: string, chartKey = "sales-admin"): Promise<OrgChartEmployee[]> {
  return sql<TeamMemberRow[]>`
    WITH RECURSIVE branch_root AS (
      SELECT id, pair_group FROM org_chart_nodes WHERE chart_key = ${chartKey} AND tag = ${tag}
    ),
    subtree AS (
      SELECT n.id FROM org_chart_nodes n
      WHERE n.chart_key = ${chartKey} AND (
        n.id IN (SELECT id FROM branch_root)
        OR (n.pair_group IS NOT NULL AND n.pair_group IN (SELECT pair_group FROM branch_root WHERE pair_group IS NOT NULL))
      )
      UNION ALL
      SELECT n.id FROM org_chart_nodes n JOIN subtree s ON n.parent_id = s.id
    )
    SELECT
      e.id,
      TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) AS name,
      e.nickname,
      e.photo_url,
      e.phone,
      e.email,
      e.is_active,
      p.position AS position_name,
      d.name AS department_name,
      n.responsibilities
    FROM subtree s
    JOIN org_chart_nodes n ON n.id = s.id
    JOIN employees e ON e.id = n.employee_id
    LEFT JOIN positions p ON p.id = e.position_id
    LEFT JOIN departments d ON d.id = e.department_id
    ORDER BY e.first_name, e.last_name
  `;
}

export async function getEmployeeProfile(employeeId: number, chartKey = "sales-admin"): Promise<OrgChartEmployee | null> {
  const rows = await sql<TeamMemberRow[]>`
    SELECT
      e.id,
      TRIM(CONCAT_WS(' ', e.first_name, e.last_name)) AS name,
      e.nickname,
      e.photo_url,
      e.phone,
      e.email,
      e.is_active,
      p.position AS position_name,
      d.name AS department_name,
      n.responsibilities
    FROM employees e
    LEFT JOIN positions p ON p.id = e.position_id
    LEFT JOIN departments d ON d.id = e.department_id
    LEFT JOIN org_chart_nodes n ON n.employee_id = e.id AND n.chart_key = ${chartKey}
    WHERE e.id = ${employeeId}
    LIMIT 1
  `;
  return rows[0] ?? null;
}

const TEAM_PATHS = ["/sales-admin/org-chart", "/sales-admin/tt", "/sales-admin/mt", "/sales-admin/clm", "/sales-admin/system"];

function revalidateTeamPaths() {
  for (const path of TEAM_PATHS) revalidatePath(path);
}

export async function assignEmployeeToNode(
  nodeId: number,
  employeeId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireRole("admin");
  } catch {
    return { ok: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  await sql`UPDATE org_chart_nodes SET employee_id = ${employeeId}, updated_at = NOW() WHERE id = ${nodeId}`;
  revalidateTeamPaths();
  return { ok: true };
}

export async function unassignNode(
  nodeId: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireRole("admin");
  } catch {
    return { ok: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  await sql`UPDATE org_chart_nodes SET employee_id = NULL, updated_at = NOW() WHERE id = ${nodeId}`;
  revalidateTeamPaths();
  return { ok: true };
}

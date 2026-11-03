import type postgres from "postgres";
import sql from "@/lib/db";
import { createClient } from "@/lib/supabase/server";
import { CHANGE_TYPES, type ChangeTypeDef } from "@/lib/employee-change-types";

type Queryable = postgres.ISql;

export async function currentUserEmail(): Promise<string | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.email ?? null;
}

export async function lookupName(q: Queryable, type: ChangeTypeDef, id: unknown): Promise<string | null> {
  if (typeof id !== "number") return null;
  const [row] = await q`SELECT ${q(type.nameColumn)} AS name FROM ${q(type.table)} WHERE id = ${id}`;
  return (row?.name as string | undefined) ?? null;
}

/**
 * Future-dated changes stay "pending" until their effective date. There is no scheduler,
 * so due rows are applied the next time the employee page is opened.
 */
export async function applyDueChanges(employeeId: number): Promise<void> {
  try {
    await sql.begin(async (tx) => {
      const due = await tx`
        SELECT id, change_type, new_value
        FROM employee_change_history
        WHERE employee_id = ${employeeId} AND status = 'pending' AND effective_date <= (NOW() AT TIME ZONE 'Asia/Bangkok')::date
        ORDER BY effective_date, id
        FOR UPDATE
      `;
      for (const row of due) {
        const type = CHANGE_TYPES.find((t) => t.key === row.change_type);
        if (!type) continue;
        const newId = (row.new_value as { id: number | null }).id;
        await tx`UPDATE employees SET ${tx(type.column)} = ${newId}, updated_at = NOW() WHERE id = ${employeeId}`;
        await tx`UPDATE employee_change_history SET status = 'applied', applied_at = NOW() WHERE id = ${row.id}`;
      }
    });
  } catch (error) {
    // table not migrated yet (42P01) is expected until migration 017 is run; the page must still render
    if ((error as { code?: string }).code !== "42P01") {
      console.error("Failed to apply pending employee changes:", error);
    }
  }
}

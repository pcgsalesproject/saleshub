"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireRole } from "@/lib/roles";

async function resolveCheckerId(): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return null;

  const rows = await sql<{ id: number }[]>`
    SELECT id FROM employees WHERE lower(email) = lower(${email}) LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function resolveOpenRoundId(): Promise<number | null> {
  const rows = await sql<{ id: number }[]>`SELECT id FROM inspection_rounds WHERE status = 'open' LIMIT 1`;
  return rows[0]?.id ?? null;
}

async function resolveCurrentHolderId(assetId: number): Promise<number | null> {
  const rows = await sql<{ employee_id: number }[]>`
    SELECT employee_id FROM asset_assignments WHERE asset_id = ${assetId} AND returned_at IS NULL LIMIT 1
  `;
  return rows[0]?.employee_id ?? null;
}

export async function createAssetCheck(assetId: number, revalidate: string, formData: FormData) {
  await requireRole("admin");

  const checkedById = await resolveCheckerId();
  const roundId = await resolveOpenRoundId();
  const holderEmployeeId = await resolveCurrentHolderId(assetId);
  const status = (formData.get("status") as string) || "found";
  const comment = (formData.get("comment") as string) || null;

  await sql`
    INSERT INTO asset_checks (asset_id, checked_by_id, status, comment, round_id, holder_employee_id)
    VALUES (${assetId}, ${checkedById}, ${status}, ${comment}, ${roundId}, ${holderEmployeeId})
  `;

  revalidatePath(revalidate);
}

interface CheckItem {
  assetId: number;
  status: string;
  comment: string | null;
}

export async function createAssetChecksBatch(
  employeeId: number,
  comment: string | null,
  items: CheckItem[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await requireRole("admin");
  } catch {
    return { ok: false, error: "คุณไม่มีสิทธิ์ดำเนินการนี้" };
  }

  if (items.length === 0) return { ok: true };

  const roundId = await resolveOpenRoundId();
  if (!roundId) {
    return { ok: false, error: "ยังไม่มีรอบการตรวจสอบที่เปิดอยู่ กรุณาสร้างรอบการตรวจสอบก่อนบันทึกผล" };
  }

  const checkedById = await resolveCheckerId();

  try {
    await sql.begin(async (tx) => {
      const [session] = await tx<{ id: number }[]>`
        INSERT INTO inspection_sessions (employee_id, checked_by_id, comment)
        VALUES (${employeeId}, ${checkedById}, ${comment})
        RETURNING id
      `;

      for (const item of items) {
        await tx`
          INSERT INTO asset_checks (asset_id, checked_by_id, status, comment, session_id, round_id, holder_employee_id)
          VALUES (${item.assetId}, ${checkedById}, ${item.status}, ${item.comment}, ${session.id}, ${roundId}, ${employeeId})
        `;
      }
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "เกิดข้อผิดพลาด ไม่สามารถบันทึกได้" };
  }

  revalidatePath("/inspection/new");
  revalidatePath("/inspection/summary");
  return { ok: true };
}

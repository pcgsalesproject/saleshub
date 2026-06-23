"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function resolveCheckerId(): Promise<number | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email;
  if (!email) return null;

  const rows = await sql<{ id: number }[]>`
    SELECT id FROM employees WHERE email ILIKE ${email} LIMIT 1
  `;
  return rows[0]?.id ?? null;
}

async function resolveOpenRoundId(): Promise<number | null> {
  const rows = await sql<{ id: number }[]>`SELECT id FROM inspection_rounds WHERE status = 'open' LIMIT 1`;
  return rows[0]?.id ?? null;
}

export async function createAssetCheck(assetId: number, revalidate: string, formData: FormData) {
  const checkedById = await resolveCheckerId();
  const roundId = await resolveOpenRoundId();
  const status = (formData.get("status") as string) || "found";
  const comment = (formData.get("comment") as string) || null;

  await sql`
    INSERT INTO asset_checks (asset_id, checked_by_id, status, comment, round_id)
    VALUES (${assetId}, ${checkedById}, ${status}, ${comment}, ${roundId})
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
  if (items.length === 0) return { ok: true };

  const roundId = await resolveOpenRoundId();
  if (!roundId) {
    return { ok: false, error: "ยังไม่มีรอบการตรวจสอบที่เปิดอยู่ กรุณาสร้างรอบการตรวจสอบก่อนบันทึกผล" };
  }

  const checkedById = await resolveCheckerId();

  await sql.begin(async (tx) => {
    const [session] = await tx<{ id: number }[]>`
      INSERT INTO inspection_sessions (employee_id, checked_by_id, comment)
      VALUES (${employeeId}, ${checkedById}, ${comment})
      RETURNING id
    `;

    for (const item of items) {
      await tx`
        INSERT INTO asset_checks (asset_id, checked_by_id, status, comment, session_id, round_id)
        VALUES (${item.assetId}, ${checkedById}, ${item.status}, ${item.comment}, ${session.id}, ${roundId})
      `;
    }
  });

  revalidatePath("/inspection/new");
  revalidatePath("/inspection/summary");
  return { ok: true };
}

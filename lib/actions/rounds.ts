"use server";

import sql from "@/lib/db";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/roles";

export interface InspectionRound {
  id: number;
  year: number;
  name: string;
  status: "open" | "closed";
  created_at: string;
  closed_at: string | null;
}

export async function listRounds(): Promise<InspectionRound[]> {
  return sql<InspectionRound[]>`SELECT * FROM inspection_rounds ORDER BY year DESC`;
}

export async function getOpenRound(): Promise<InspectionRound | null> {
  const rows = await sql<InspectionRound[]>`SELECT * FROM inspection_rounds WHERE status = 'open' LIMIT 1`;
  return rows[0] ?? null;
}

export async function createRound(year: number, name: string) {
  await requireRole("admin");

  await sql.begin(async (tx) => {
    await tx`UPDATE inspection_rounds SET status = 'closed', closed_at = NOW() WHERE status = 'open'`;
    await tx`INSERT INTO inspection_rounds (year, name, status) VALUES (${year}, ${name}, 'open')`;
  });

  revalidatePath("/inspection/rounds");
  revalidatePath("/inspection/summary");
}

export async function closeRound(id: number) {
  await requireRole("admin");

  await sql`UPDATE inspection_rounds SET status = 'closed', closed_at = NOW() WHERE id = ${id}`;

  revalidatePath("/inspection/rounds");
  revalidatePath("/inspection/summary");
}

export async function reopenRound(id: number) {
  await requireRole("admin");

  await sql.begin(async (tx) => {
    await tx`UPDATE inspection_rounds SET status = 'closed', closed_at = NOW() WHERE status = 'open'`;
    await tx`UPDATE inspection_rounds SET status = 'open', closed_at = NULL WHERE id = ${id}`;
  });

  revalidatePath("/inspection/rounds");
  revalidatePath("/inspection/summary");
}

import Link from "next/link";
import { notFound } from "next/navigation";
import sql from "@/lib/db";
import type { Asset } from "@/lib/types";
import { assignAsset } from "@/lib/actions/assets";
import AssignForm from "./AssignForm";

interface AssetDetail extends Asset {
  asset_type_name: string | null;
  is_assigned: boolean;
}

interface EmployeeOption {
  id: number;
  employee_id: string | null;
  name: string;
  department_name: string | null;
  position_name: string | null;
}

async function getAsset(id: number): Promise<AssetDetail | null> {
  const rows = await sql<AssetDetail[]>`
    SELECT a.*, at.name AS asset_type_name,
      EXISTS (
        SELECT 1 FROM asset_assignments aa
        WHERE aa.asset_id = a.id AND aa.returned_at IS NULL
      ) AS is_assigned
    FROM assets a
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    WHERE a.id = ${id}
  `;
  return rows[0] ?? null;
}

async function getEmployees(): Promise<EmployeeOption[]> {
  return sql<EmployeeOption[]>`
    SELECT e.id, e.employee_id,
      TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS name,
      d.name AS department_name,
      p.position AS position_name
    FROM employees e
    LEFT JOIN departments d ON e.department_id = d.id
    LEFT JOIN positions p ON e.position_id = p.id
    WHERE e.is_active = true
    ORDER BY e.first_name
  `;
}

export default async function AssignAssetPage(props: PageProps<"/assets/[id]/assign">) {
  const { id } = await props.params;
  const numId = Number(id);

  const [asset, employees] = await Promise.all([getAsset(numId), getEmployees()]);

  if (!asset) notFound();

  const action = assignAsset.bind(null, numId);

  return (
    <div className="flex flex-col gap-4">

      {/* Breadcrumb */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          <Link href="/assets" className="text-gray-400 hover:text-gray-700">Assets</Link>
          <span className="text-gray-300">›</span>
          <Link href={`/assets/${asset.id}`} className="text-gray-400 hover:text-gray-700">{asset.asset_tag}</Link>
          <span className="text-gray-300">›</span>
          <span className="font-semibold text-gray-800">มอบหมาย</span>
        </div>
        <Link
          href={`/assets/${asset.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3.5 py-2 bg-white hover:bg-gray-50 transition-colors"
        >
          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          กลับ
        </Link>
      </div>

      {asset.is_assigned && (
        <div className="flex items-center gap-2 px-4 py-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
          <svg fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          ทรัพย์สินนี้กำลังถูกใช้งานอยู่ — ไม่สามารถมอบหมายซ้ำได้ กรุณาคืนทรัพย์สินก่อน
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 items-start">

        {/* Asset summary */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            ทรัพย์สิน
          </h2>
          <div className="space-y-1">
            {[
              ["Asset Tag", asset.asset_tag],
              ["ชื่อทรัพย์สิน", asset.asset_name],
              ["ประเภท", asset.asset_type_name],
              ["ยี่ห้อ / รุ่น", [asset.brand, asset.model].filter(Boolean).join(" ") || null],
              ["Serial Number", asset.serial_number],
              ["หมายเลขโทรศัพท์", asset.phone_number],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between gap-4 py-2.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-400">{label}</span>
                <span className="text-sm font-semibold text-gray-800">{value || "—"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assign form */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
            <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
            มอบหมายให้พนักงาน
          </h2>
          <AssignForm action={action} employees={employees} disabled={asset.is_assigned} />
        </div>

      </div>
    </div>
  );
}

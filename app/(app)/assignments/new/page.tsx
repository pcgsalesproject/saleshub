import Link from "next/link";
import Header from "@/components/Header";
import sql from "@/lib/db";
import { peekNextDocumentNumber } from "@/lib/actions/assets";
import AcknowledgeForm from "./AcknowledgeForm";
import ReturnForm from "./ReturnForm";

interface EmployeeOption {
  id: number;
  employee_id: string;
  name: string;
  department_name: string | null;
  position_name: string | null;
}

interface AssetOption {
  id: number;
  asset_tag: string;
  asset_name: string;
  asset_type_id: number | null;
  asset_type_name: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  phone_number: string | null;
}

interface AssetTypeOption {
  id: number;
  name: string;
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

async function getAvailableAssets(): Promise<AssetOption[]> {
  return sql<AssetOption[]>`
    SELECT a.id, a.asset_tag, a.asset_name, a.asset_type_id, at.name AS asset_type_name, a.brand, a.model, a.serial_number, a.phone_number
    FROM assets a
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    LEFT JOIN LATERAL (
      SELECT aa.employee_id FROM asset_assignments aa
      WHERE aa.asset_id = a.id AND aa.returned_at IS NULL
      ORDER BY aa.assigned_at DESC LIMIT 1
    ) cur ON true
    WHERE cur.employee_id IS NULL AND a.status != 'repair'
    ORDER BY a.asset_tag
  `;
}

async function getAssetTypes(): Promise<AssetTypeOption[]> {
  return sql<AssetTypeOption[]>`SELECT id, name FROM asset_types ORDER BY name`;
}

interface ActiveAssignment {
  id: number;
  asset_id: number;
  asset_tag: string;
  asset_name: string;
  asset_type_name: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  phone_number: string | null;
  employee_id: number;
}

async function getActiveAssignments(): Promise<ActiveAssignment[]> {
  return sql<ActiveAssignment[]>`
    SELECT
      aa.id,
      a.id AS asset_id, a.asset_tag, a.asset_name,
      at.name AS asset_type_name,
      a.brand, a.model, a.serial_number, a.phone_number,
      aa.employee_id::int AS employee_id
    FROM asset_assignments aa
    JOIN assets a ON aa.asset_id = a.id
    LEFT JOIN asset_types at ON a.asset_type_id = at.id
    WHERE aa.returned_at IS NULL
    ORDER BY a.asset_tag
  `;
}

export default async function NewAcknowledgePage(props: PageProps<"/assignments/new">) {
  const { tab = "receive" } = await props.searchParams ?? {};
  const activeTab = tab === "return" ? "return" : "receive";

  const tabs = [
    { key: "receive", label: "รับทรัพย์สิน" },
    { key: "return", label: "คืนทรัพย์สิน" },
  ];

  return (
    <div>
      <Header
        title="แบบฟอร์มทรัพย์สิน"
        subtitle={activeTab === "return" ? "บันทึกการคืนทรัพย์สินจากพนักงาน" : "มอบทรัพย์สินให้พนักงานพร้อมออกเอกสาร PDF"}
      />

      <div className="flex items-center gap-1 mb-4 bg-white border border-gray-200 rounded-xl p-1 w-fit">
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={`/assignments/new?tab=${t.key}`}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              activeTab === t.key
                ? "bg-[#102E5A] text-white"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {activeTab === "return" ? (
        <ReturnTab />
      ) : (
        <ReceiveTab />
      )}
    </div>
  );
}

async function ReceiveTab() {
  const [employees, assets, assetTypes, previewDocNumber] = await Promise.all([
    getEmployees(),
    getAvailableAssets(),
    getAssetTypes(),
    peekNextDocumentNumber(),
  ]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <AcknowledgeForm employees={employees} assets={assets} assetTypes={assetTypes} previewDocNumber={previewDocNumber} />
    </div>
  );
}

async function ReturnTab() {
  const [employees, assignments, previewDocNumber] = await Promise.all([
    getEmployees(),
    getActiveAssignments(),
    peekNextDocumentNumber(),
  ]);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <ReturnForm employees={employees} assignments={assignments} previewDocNumber={previewDocNumber} />
    </div>
  );
}

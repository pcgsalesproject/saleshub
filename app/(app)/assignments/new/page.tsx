import Header from "@/components/Header";
import sql from "@/lib/db";
import { peekNextDocumentNumber } from "@/lib/actions/assets";
import AcknowledgeForm from "./AcknowledgeForm";

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

export default async function NewAcknowledgePage() {
  const [employees, assets, assetTypes, previewDocNumber] = await Promise.all([
    getEmployees(),
    getAvailableAssets(),
    getAssetTypes(),
    peekNextDocumentNumber(),
  ]);

  return (
    <div>
      <Header title="แบบฟอร์มรับทรัพย์สิน" subtitle="มอบทรัพย์สินให้พนักงานพร้อมออกเอกสาร PDF" />
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <AcknowledgeForm employees={employees} assets={assets} assetTypes={assetTypes} previewDocNumber={previewDocNumber} />
      </div>
    </div>
  );
}

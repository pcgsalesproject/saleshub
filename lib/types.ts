export type EmployeeStatus = "Active" | "Inactive" | "Resigned";

export interface Department {
  id: number;
  name: string;
}

export interface Position {
  id: number;
  position: string;
}

export interface Employee {
  id: number;
  employee_id: string;
  title_th: string | null;
  first_name: string;
  last_name: string;
  full_name: string | null;
  prefix: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  full_name_en: string | null;
  date_of_birth: string | null;
  national_id: string | null;
  phone: string | null;
  email: string | null;
  department_id: number | null;
  department_name: string | null;
  position_id: number | null;
  position_name: string | null;
  sales_zone: string | null;
  provinces: string | null;
  status: EmployeeStatus;
  created_at: string;
  updated_at: string;
}

export type AssetStatus = "Available" | "Assigned" | "Repair" | "Retired";

export interface AssetCategory {
  id: number;
  name: string;
}

export interface Asset {
  id: number;
  asset_tag: string;
  category_id: number | null;
  category_name: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  purchase_date: string | null;
  start_using_date: string | null;
  warranty_period: number | null;
  expiration_date: string | null;
  status: AssetStatus;
  image_path: string | null;
  warranty_doc_path: string | null;
}

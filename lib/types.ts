export interface Department {
  id: number;
  name: string;
}

export interface Position {
  id: number;
  position: string;
  position_en: string | null;
}

export interface SalesArea {
  id: number;
  name: string;
  department: number | null;
}

export interface Employee {
  id: number;
  employee_id: string;
  prefix_th: string | null;
  first_name: string;
  last_name: string;
  prefix_en: string | null;
  first_name_en: string | null;
  last_name_en: string | null;
  date_of_birth: string | null;
  national_id: string | null;
  phone: string | null;
  email: string | null;
  department_id: number | null;
  department_name: string | null;
  position_id: number | null;
  position_name: string | null;
  sales_area_id: number | null;
  sales_area_name: string | null;
  manager_id: number | null;
  manager_name: string | null;
  photo_url: string | null;
  start_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface EmployeeOption {
  id: number;
  name: string;
}

export interface AssetType {
  id: number;
  code: string;
  name: string;
}

export interface Asset {
  id: number;
  asset_tag: string;
  asset_code: string | null;
  asset_name: string;
  asset_type_id: number | null;
  asset_type_name: string | null;
  brand: string | null;
  model: string | null;
  serial_number: string | null;
  phone_number: string | null;
  purchase_price: number | null;
  po_number: string | null;
  vendor: string | null;
  warranty_conditions: string | null;
  purchase_date: string | null;
  warranty_expiry: string | null;
  status: string | null;
  note: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetAssignment {
  id: number;
  employee_id: number;
  asset_id: number;
  assigned_at: string | null;
  returned_at: string | null;
  note: string | null;
}

export interface AssetCheck {
  id: number;
  asset_id: number;
  checked_by_id: number | null;
  status: string;
  comment: string | null;
  checked_at: string;
}

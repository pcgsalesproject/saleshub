// Client-safe description of the three change types stored in employee_change_history.

export type ChangeTypeKey = "department_transfer" | "sales_area_transfer" | "position_adjustment";

export interface ChangeTypeDef {
  key: ChangeTypeKey;
  /** employees column that holds the current value */
  column: "department_id" | "sales_area_id" | "position_id";
  /** master table + display column */
  table: "departments" | "sales_areas" | "positions";
  nameColumn: "name" | "area_name" | "position";
  label: string;
  oldLabel: string;
  newLabel: string;
  /** timeline colours (Tailwind classes) */
  dot: string;
  chip: string;
  border: string;
  /** card background on the timeline */
  tint: string;
}

export const CHANGE_TYPES: ChangeTypeDef[] = [
  {
    key: "department_transfer", column: "department_id", table: "departments", nameColumn: "name",
    label: "ย้ายแผนก", oldLabel: "แผนกเดิม", newLabel: "แผนกใหม่",
    dot: "bg-blue-500", chip: "bg-blue-50 text-blue-700", border: "border-blue-200",
    tint: "bg-blue-50/70 border-blue-100",
  },
  {
    key: "sales_area_transfer", column: "sales_area_id", table: "sales_areas", nameColumn: "area_name",
    label: "ย้ายเขตการขาย", oldLabel: "เขตการขายเดิม", newLabel: "เขตการขายใหม่",
    dot: "bg-green-500", chip: "bg-green-50 text-green-700", border: "border-green-200",
    tint: "bg-green-50/70 border-green-100",
  },
  {
    key: "position_adjustment", column: "position_id", table: "positions", nameColumn: "position",
    label: "ปรับตำแหน่ง", oldLabel: "ตำแหน่งเดิม", newLabel: "ตำแหน่งใหม่",
    dot: "bg-purple-500", chip: "bg-purple-50 text-purple-700", border: "border-purple-200",
    tint: "bg-purple-50/70 border-purple-100",
  },
];

export interface ChangeSnapshot {
  id: number | null;
  name: string | null;
}

export interface ChangeHistoryRow {
  id: number;
  change_type: ChangeTypeKey;
  old_value: ChangeSnapshot;
  new_value: ChangeSnapshot;
  effective_date: string; // YYYY-MM-DD
  reason: string;
  status: "applied" | "pending";
  recorded_by: string | null;
  created_at: string;
}

export interface MasterOption {
  id: number;
  name: string;
}

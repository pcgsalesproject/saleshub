"use client";

import Link from "next/link";
import type { Employee, Department } from "@/lib/types";
import SubmitButton from "@/components/SubmitButton";

interface Props {
  action: (formData: FormData) => Promise<void>;
  departments: Department[];
  employee?: Employee;
}

const STATUS_OPTIONS = ["Active", "Inactive", "Resigned"] as const;

export default function EmployeeForm({ action, departments, employee }: Props) {
  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Employee ID <span className="text-red-500">*</span>
          </label>
          <input
            name="employee_id"
            required
            defaultValue={employee?.employee_id}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
            placeholder="e.g. EMP001"
          />
        </div>

        <div />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            First Name <span className="text-red-500">*</span>
          </label>
          <input
            name="first_name"
            required
            defaultValue={employee?.first_name}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Last Name <span className="text-red-500">*</span>
          </label>
          <input
            name="last_name"
            required
            defaultValue={employee?.last_name}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
          <input
            type="date"
            name="date_of_birth"
            defaultValue={employee?.date_of_birth?.slice(0, 10)}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">National ID</label>
          <input
            name="national_id"
            defaultValue={employee?.national_id ?? ""}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
          <input
            name="phone"
            type="tel"
            defaultValue={employee?.phone ?? ""}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={employee?.email ?? ""}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
          <select
            name="department_id"
            defaultValue={employee?.department_id ?? ""}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
          >
            <option value="">— Select department —</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
          <input
            name="position"
            defaultValue={employee?.position ?? ""}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select
            name="status"
            defaultValue={employee?.status ?? "Active"}
            className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-2">
        <SubmitButton
          label={employee ? "Save Changes" : "Add Employee"}
          pendingLabel="Saving…"
        />
        <Link
          href="/employees"
          className="rounded-lg border border-gray-200 px-5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

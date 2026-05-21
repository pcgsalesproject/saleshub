import Link from "next/link";
import pool from "@/lib/db";
import type { Employee } from "@/lib/types";
import Header from "@/components/Header";
import { deleteEmployee } from "@/lib/actions/employees";
import DeleteButton from "./DeleteButton";

async function getEmployees(search: string): Promise<Employee[]> {
  const like = `%${search}%`;
  const [rows] = await pool.execute(
    `SELECT e.*, d.name AS department_name
     FROM employees e
     LEFT JOIN departments d ON e.department_id = d.id
     WHERE e.first_name LIKE ? OR e.last_name LIKE ? OR e.employee_id LIKE ? OR e.email LIKE ?
     ORDER BY e.created_at DESC`,
    [like, like, like, like]
  );
  return rows as Employee[];
}

const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-700",
  Inactive: "bg-gray-100 text-gray-600",
  Resigned: "bg-red-100 text-red-700",
};

export default async function EmployeesPage(props: PageProps<"/employees">) {
  const { search = "" } = await props.searchParams ?? {};
  const employees = await getEmployees(String(search));

  return (
    <div>
      <Header
        title="Employees"
        subtitle={`${employees.length} record${employees.length !== 1 ? "s" : ""}`}
        actions={
          <Link
            href="/employees/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#102E5A] px-4 py-2 text-sm font-medium text-white hover:bg-[#0b2145] transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Add Employee
          </Link>
        }
      />

      {/* Search */}
      <form className="mb-5">
        <div className="relative max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            name="search"
            defaultValue={String(search)}
            placeholder="Search by name, ID, email…"
            className="w-full rounded-lg border border-gray-200 bg-white pl-9 pr-4 py-2 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#102E5A]/30"
          />
        </div>
      </form>

      {/* Table */}
      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left font-medium text-gray-500">Employee ID</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Full Name</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Department</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Position</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Email</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Phone</th>
              <th className="px-4 py-3 text-left font-medium text-gray-500">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-gray-400">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-600">{emp.employee_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {emp.first_name} {emp.last_name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{emp.department_name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.position ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.email ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{emp.phone ?? "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[emp.status] ?? ""}`}>
                      {emp.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/employees/${emp.id}/edit`}
                        className="rounded px-2.5 py-1 text-xs font-medium text-[#102E5A] border border-[#102E5A]/30 hover:bg-[#102E5A]/5 transition-colors"
                      >
                        Edit
                      </Link>
                      <DeleteButton id={emp.id} name={`${emp.first_name} ${emp.last_name}`} />
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

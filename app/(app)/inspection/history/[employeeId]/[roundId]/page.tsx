import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import {
  getEmployeeBasic,
  getEmployeeRoundChecks,
  getRoundById,
} from "@/lib/inspection";

const STATUS_META: Record<string, { label: string; cls: string }> = {
  found: { label: "พบครบถ้วน", cls: "bg-green-50 text-green-700 border-green-200" },
  missing: { label: "ไม่พบ", cls: "bg-orange-50 text-orange-700 border-orange-200" },
  damaged: { label: "ไม่เกี่ยวข้อง", cls: "bg-gray-100 text-gray-500 border-gray-200" },
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function formatDateTime(v: string) {
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default async function InspectionHistoryDetailPage(
  props: PageProps<"/inspection/history/[employeeId]/[roundId]">
) {
  const { employeeId, roundId } = await props.params;
  const employee = await getEmployeeBasic(Number(employeeId));
  const round = await getRoundById(Number(roundId));

  if (!employee || !round) notFound();

  const checks = await getEmployeeRoundChecks(employee.id, round.id);
  const problemCount = checks.filter((c) => c.status !== "found").length;
  const buddhistYear = round.year + 543;

  return (
    <div className="flex flex-col gap-4">
      <Header
        title="ผลการตรวจสอบย้อนหลัง"
        subtitle={`${round.name} (${buddhistYear})`}
        actions={
          <Link
            href={`/inspection/new?employee_id=${employee.id}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#102E5A] border border-[#102E5A] rounded-lg px-3.5 py-2 hover:bg-[#eef2fa] transition-colors"
          >
            ← กลับ
          </Link>
        }
      />

      <div className="flex items-center justify-between gap-4 flex-wrap bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center gap-4">
          <span className="flex items-center justify-center w-14 h-14 rounded-full bg-[#eef2fa] text-[#102E5A] text-lg font-semibold flex-shrink-0">
            {getInitials(employee.name)}
          </span>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-base font-semibold text-gray-800">{employee.name}</p>
              <span className="text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
                {employee.employee_id ?? "—"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
              <span>🏢 {employee.department_name ?? "—"}</span>
              <span>💼 {employee.position_name ?? "—"}</span>
            </div>
          </div>
        </div>
        <span
          className={`inline-flex items-center text-xs font-medium rounded-full px-3 py-1 border whitespace-nowrap ${
            problemCount > 0 ? "bg-red-50 text-red-700 border-red-200" : "bg-green-50 text-green-700 border-green-200"
          }`}
        >
          รอบปี {buddhistYear} ({round.year}) · {problemCount > 0 ? `พบปัญหา ${problemCount} รายการ` : "ตรวจสอบแล้ว"}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-800 mb-4">
          <span className="w-2 h-2 rounded-full bg-orange-400 flex-shrink-0" />
          รายการทรัพย์สินที่ตรวจสอบ
        </h2>

        {checks.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">ไม่มีข้อมูลการตรวจสอบในรอบนี้</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">#</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">รหัสทรัพย์สิน</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">ชื่อทรัพย์สิน</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">ประเภท</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">ผลตรวจสอบ</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 pr-4 whitespace-nowrap">วันที่ตรวจ</th>
                  <th className="text-left text-xs font-medium text-gray-400 pb-2 whitespace-nowrap">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {checks.map((c, i) => {
                  const meta = STATUS_META[c.status] ?? { label: c.status, cls: "bg-gray-50 text-gray-500 border-gray-200" };
                  return (
                    <tr key={c.asset_id} className="border-b border-gray-50 last:border-0">
                      <td className="py-3 pr-4 text-gray-400">{i + 1}</td>
                      <td className="py-3 pr-4 font-mono text-xs text-gray-500 whitespace-nowrap">{c.asset_tag}</td>
                      <td className="py-3 pr-4">
                        <p className="font-medium text-gray-800 whitespace-nowrap">{c.asset_name}</p>
                        <p className="text-xs text-gray-400 whitespace-nowrap">SN: {c.serial_number ?? "—"}</p>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{c.asset_type_name ?? "—"}</td>
                      <td className="py-3 pr-4">
                        <span className={`inline-flex items-center text-xs font-medium rounded-full px-2.5 py-1 border whitespace-nowrap ${meta.cls}`}>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 whitespace-nowrap">{formatDateTime(c.checked_at)}</td>
                      <td className="py-3 text-gray-600">{c.comment || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

import Link from "next/link";
import Header from "@/components/Header";
import sql from "@/lib/db";
import ViewPdfButton from "../assignments/ViewPdfButton";
import RecordsFilters from "./RecordsFilters";

interface DocumentRow {
  doc_number: string;
  doc_type: "receive" | "return";
  doc_date: string | null;
  employee_id: number;
  employee_name: string;
  department_name: string | null;
}

interface DocumentFilters {
  search: string;
  dateFrom: string;
  dateTo: string;
  docType: string;
  sort: string;
}

async function getDocuments(filters: DocumentFilters): Promise<DocumentRow[]> {
  const { search, dateFrom, dateTo, docType, sort } = filters;

  const like = `%${search}%`;
  const searchCond = search ? sql`AND (doc_number ILIKE ${like} OR employee_name ILIKE ${like})` : sql``;
  const typeCond = docType ? sql`AND doc_type = ${docType}` : sql``;
  const fromCond = dateFrom ? sql`AND doc_date >= ${dateFrom}` : sql``;
  const toCond = dateTo ? sql`AND doc_date < (${dateTo}::date + INTERVAL '1 day')` : sql``;
  const orderBy =
    sort === "date_desc" ? sql`doc_date DESC` :
    sort === "date_asc" ? sql`doc_date ASC` :
    sort === "doc_asc" ? sql`doc_number ASC` :
    sort === "employee_asc" ? sql`employee_name ASC` :
    sort === "employee_desc" ? sql`employee_name DESC` :
    sql`doc_number DESC`;

  return sql<DocumentRow[]>`
    SELECT * FROM (
      SELECT * FROM (
        SELECT DISTINCT ON (aa.doc_number)
          aa.doc_number, 'receive' AS doc_type,
          aa.assigned_at AS doc_date,
          e.id AS employee_id,
          TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS employee_name,
          d.name AS department_name
        FROM asset_assignments aa
        JOIN employees e ON aa.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE aa.doc_number IS NOT NULL
        ORDER BY aa.doc_number, aa.id
      ) receive_doc
      UNION ALL
      SELECT * FROM (
        SELECT DISTINCT ON (aa.return_doc_number)
          aa.return_doc_number AS doc_number, 'return' AS doc_type,
          aa.returned_at AS doc_date,
          e.id AS employee_id,
          TRIM(CONCAT(e.prefix_th, ' ', e.first_name, ' ', e.last_name)) AS employee_name,
          d.name AS department_name
        FROM asset_assignments aa
        JOIN employees e ON aa.employee_id = e.id
        LEFT JOIN departments d ON e.department_id = d.id
        WHERE aa.return_doc_number IS NOT NULL
        ORDER BY aa.return_doc_number, aa.id
      ) return_doc
    ) all_docs
    WHERE 1=1 ${searchCond} ${typeCond} ${fromCond} ${toCond}
    ORDER BY ${orderBy}
  `;
}

function formatDate(v?: string | null) {
  if (!v) return "—";
  const d = new Date(v);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export default async function AssetHistoryPage(props: PageProps<"/asset-history">) {
  const {
    search = "",
    dateFrom = "",
    dateTo = "",
    docType = "",
    sort = "",
  } = await props.searchParams ?? {};

  const filters: DocumentFilters = {
    search: String(search),
    dateFrom: String(dateFrom),
    dateTo: String(dateTo),
    docType: String(docType),
    sort: String(sort),
  };

  const documents = await getDocuments(filters);

  return (
    <div>
      <Header
        title="Asset Records"
        subtitle="บันทึกทรัพย์สินฝ่ายขาย"
        actions={
          <Link href="/assignments/new" className="btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            แบบฟอร์มทรัพย์สิน
          </Link>
        }
      />

      <RecordsFilters
        defaultSearch={filters.search}
        defaultDateFrom={filters.dateFrom}
        defaultDateTo={filters.dateTo}
        defaultDocType={filters.docType}
        defaultSort={filters.sort}
      />

      <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
        {documents.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">ไม่พบข้อมูล</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 w-36">วันที่</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 w-40">เลขที่เอกสาร</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 w-36">ประเภท</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 w-54">พนักงาน</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-5 py-3 w-40">ฝ่าย</th>
                <th className="px-5 py-3 w-32"></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((d) => (
                <tr key={`${d.doc_type}-${d.doc_number}`} className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 text-gray-600">{formatDate(d.doc_date)}</td>
                  <td className="px-5 py-3.5 font-mono text-gray-800">{d.doc_number}</td>
                  <td className="px-5 py-3.5">
                    {d.doc_type === "return" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full px-2.5 py-1">
                        คืนทรัพย์สิน
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 rounded-full px-2.5 py-1">
                        รับทรัพย์สิน
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <Link href={`/employees/${d.employee_id}?tab=assignments`} className="font-medium text-gray-800 hover:text-[#102E5A] hover:underline">
                      {d.employee_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3.5 text-gray-600">{d.department_name ?? "—"}</td>
                  <td className="px-5 py-3.5">
                    <ViewPdfButton docNumber={d.doc_number} docType={d.doc_type} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

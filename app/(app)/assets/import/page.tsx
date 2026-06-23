import Link from "next/link";
import Header from "@/components/Header";
import AssetImportForm from "./AssetImportForm";

export default function AssetImportPage() {
  return (
    <div>
      <Header
        title="นำเข้ารายการทรัพย์สิน"
        subtitle="อัปโหลดไฟล์ CSV เพื่อเพิ่มทรัพย์สินจำนวนมาก"
        actions={
          <Link
            href="/assets"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg px-3.5 py-2 bg-white hover:bg-gray-50 transition-colors"
          >
            กลับไปรายการทรัพย์สิน
          </Link>
        }
      />
      <AssetImportForm />
    </div>
  );
}

import Header from "@/components/Header";
import TagLookup from "./TagLookup";

export default function AssetCheckLookupPage() {
  return (
    <div className="flex flex-col gap-4">
      <Header title="สแกนทรัพย์สิน" subtitle="ค้นหาทรัพย์สินจากรหัส เพื่อบันทึกผลตรวจสอบรายชิ้น" />
      <TagLookup />
    </div>
  );
}

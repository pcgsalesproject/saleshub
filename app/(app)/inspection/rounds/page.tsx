import Header from "@/components/Header";
import { listRounds } from "@/lib/actions/rounds";
import RoundsBoard from "./RoundsBoard";

export default async function InspectionRoundsPage() {
  const rounds = await listRounds();

  return (
    <div className="flex flex-col gap-4">
      <Header
        title="รอบการตรวจสอบ"
        subtitle="สร้างและจัดการรอบการตรวจสอบทรัพย์สินประจำปี"
      />
      <RoundsBoard rounds={rounds} />
    </div>
  );
}

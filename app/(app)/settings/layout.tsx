import { redirect } from "next/navigation";
import { getCurrentRole } from "@/lib/roles";

export default async function SettingsLayout({ children }: { children: React.ReactNode }) {
  if (await getCurrentRole() !== "admin") redirect("/dashboard");
  return children;
}

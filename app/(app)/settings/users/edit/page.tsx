import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import { getManagedUsers, updateUserAccess } from "@/lib/actions/user-access";
import UserForm from "../UserForm";

export default async function EditUserPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const { email } = await searchParams;
  const user = (await getManagedUsers()).find((u) => u.email.toLowerCase() === email?.toLowerCase());
  if (!user) notFound();

  return (
    <div>
      <nav className="mb-3 text-sm text-gray-500">
        <Link href="/settings" className="hover:underline">Settings</Link> &gt;{" "}
        <Link href="/settings/users" className="hover:underline">User Management</Link> &gt;{" "}
        <span className="font-medium text-gray-800">แก้ไขผู้ใช้</span>
      </nav>
      <Header title="แก้ไขผู้ใช้" subtitle={`ปรับสิทธิ์และเมนูของ ${user.username}`} />
      <UserForm
        action={updateUserAccess}
        submitLabel="บันทึกการตั้งค่า"
        initial={{ username: user.username, email: user.email, role: user.role, menu_keys: user.menu_keys }}
      />
    </div>
  );
}

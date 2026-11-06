import Link from "next/link";
import Header from "@/components/Header";
import { createUserAccess } from "@/lib/actions/user-access";
import UserForm from "../UserForm";

export default function NewUserPage() {
  return (
    <div>
      <nav className="mb-3 text-sm text-gray-500">
        <Link href="/settings" className="hover:underline">Settings</Link> &gt;{" "}
        <Link href="/settings/users" className="hover:underline">User Management</Link> &gt;{" "}
        <span className="font-medium text-gray-800">เพิ่มผู้ใช้</span>
      </nav>
      <Header title="เพิ่มผู้ใช้" subtitle="สร้างบัญชีผู้ใช้งานและกำหนดสิทธิ์การเข้าถึงเมนูในระบบ SalesHub" />
      <UserForm action={createUserAccess} submitLabel="เพิ่มผู้ใช้" />
      <p className="mt-3 text-xs text-gray-500">อีเมลใช้สำหรับรับลิงก์ลืมรหัสผ่านเท่านั้น ผู้ใช้ล็อกอินด้วย Username และรหัสผ่านที่กำหนดไว้</p>
    </div>
  );
}

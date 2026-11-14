import type { Metadata } from "next";
import adminContent from "@/content/admin.json";
import { AdminUsersManager } from "@/components/admin/AdminUsersManager";
import { requireOwner } from "@/services/adminAuth.service";
import { listAdminUsers } from "@/services/adminUsers.service";

export const metadata: Metadata = { title: "Admin Users", robots: { index: false, follow: false } };

export default async function AdminUsersPage() {
  const owner = await requireOwner();
  const { users, events } = await listAdminUsers();
  return (
    <div className="admin-page-enter mx-auto w-full max-w-[1280px] p-4 md:p-6">
      <h1 className="text-2xl font-bold">{adminContent.users.title}</h1>
      <p className="mt-1 text-sm text-[#2b2d31]/65">{adminContent.users.intro}</p>
      <AdminUsersManager currentUserId={owner.userId} events={events} users={users} />
    </div>
  );
}

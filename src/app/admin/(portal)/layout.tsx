import { AdminShell } from "@/components/admin/AdminShell";
import { requireAdmin } from "@/services/adminAuth.service";

export default async function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return <AdminShell adminEmail={admin.email} role={admin.role}>{children}</AdminShell>;
}

import { getAdminStatusLabel } from "@/lib/adminFormatting";
import type { PaymentStatus, VerificationStatus } from "@/types/orderApi";
import type { AdminFulfilmentStatus } from "@/types/admin";

type AdminStatus = PaymentStatus | VerificationStatus | AdminFulfilmentStatus;

const styles: Record<AdminStatus, string> = {
  pending_payment: "bg-amber-100 text-amber-800",
  paid: "bg-emerald-100 text-emerald-800",
  payment_failed: "bg-red-100 text-red-700",
  expired: "bg-slate-200 text-slate-700",
  not_required: "bg-slate-100 text-slate-600",
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  new: "bg-slate-200 text-slate-700",
  in_production: "bg-blue-100 text-blue-800",
  dispatched: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-red-100 text-red-700"
};

export function AdminStatusBadge({ status }: { status: AdminStatus }) {
  return <span className={`inline-flex min-h-5 items-center rounded-full px-2 py-0.5 text-[0.6875rem] font-medium leading-4 ${styles[status]}`}>{getAdminStatusLabel(status)}</span>;
}

import adminContent from "@/content/admin.json";
import { AdminOwnerActions } from "@/components/admin/AdminOwnerActions";
import { AdminStatusBadge } from "@/components/admin/AdminStatusBadge";
import { PlatePreview } from "@/components/order/PlatePreview";
import { formatAdminAddress, formatAdminDate, formatAdminMoney, getAdminPlateDetails } from "@/lib/adminFormatting";
import type { AdminOrder } from "@/types/admin";

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="flex justify-between gap-4"><dt className="text-[#2b2d31]/50">{label}</dt><dd className="text-right">{value}</dd></div>;
}

export function AdminOrderDetail({ order }: { order: AdminOrder }) {
  const totalQuantity = order.items.reduce((total, item) => total + item.quantity, 0);
  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div><h1 className="font-['Source_Code_Pro'] text-2xl font-semibold">{order.reference}</h1><p className="mt-1 text-xs text-[#2b2d31]/55">{formatAdminDate(order.createdAt, true)}</p></div>
          <div className="flex flex-wrap gap-2"><AdminStatusBadge status={order.paymentStatus} /><AdminStatusBadge status={order.verificationStatus} /><AdminStatusBadge status={order.fulfilmentStatus} /></div>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-4 text-xs sm:grid-cols-4">
          <div><dt className="text-[#2b2d31]/45">{adminContent.detail.items}</dt><dd className="mt-1 font-semibold">{totalQuantity}</dd></div>
          <div><dt className="text-[#2b2d31]/45">{adminContent.detail.subtotal}</dt><dd className="mt-1 font-semibold">{formatAdminMoney(order.subtotalPence)}</dd></div>
          <div><dt className="text-[#2b2d31]/45">{adminContent.detail.delivery}</dt><dd className="mt-1 font-semibold">{order.deliveryPence ? formatAdminMoney(order.deliveryPence) : adminContent.detail.free}</dd></div>
          <div><dt className="text-[#2b2d31]/45">{adminContent.detail.total}</dt><dd className="mt-1 font-bold">{formatAdminMoney(order.totalPence)}</dd></div>
        </dl>
      </section>

      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(260px,0.96fr)]">
        <div className="space-y-4">
          <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
            <h2 className="font-semibold">{adminContent.detail.customer}</h2>
            <div className="mt-4 grid gap-5 text-xs sm:grid-cols-2">
              <div><p>{order.customer.firstName} {order.customer.lastName}</p><p className="text-[#2b2d31]/65">{order.customer.email}</p><p className="text-[#2b2d31]/65">{order.customer.telephone}</p></div>
              <dl className="space-y-3"><div><dt className="text-[#2b2d31]/45">{adminContent.detail.deliveryAddress}</dt><dd>{formatAdminAddress(order.customer.deliveryAddress)}</dd></div><div><dt className="text-[#2b2d31]/45">{adminContent.detail.billingAddress}</dt><dd>{formatAdminAddress(order.customer.billingAddress)}</dd></div></dl>
            </div>
          </section>

          {order.items.sort((left, right) => left.position - right.position).map((item, index) => {
            const details = getAdminPlateDetails(item.config);
            return (
              <section className="rounded-lg border border-[#e5e7eb] bg-white p-5" key={item.id}>
                <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">{adminContent.detail.plate}{order.items.length > 1 ? ` ${index + 1}` : ""}</h2><span className="text-xs text-[#2b2d31]/55">{item.config.badge}</span></div>
                <p className="mt-3 text-[0.625rem] font-semibold uppercase tracking-wide text-[#2b2d31]/40">{adminContent.detail.rearYellow}</p>
                <div className="mt-1 grid items-center gap-5 lg:grid-cols-[180px_minmax(0,1fr)]">
                  <div className="rounded-md bg-[#f2f3f5] p-4"><PlatePreview config={item.config} /></div>
                  <dl className="space-y-1.5 text-xs">
                    <DetailRow label={adminContent.detail.product} value={item.config.productName} />
                    <DetailRow label={adminContent.detail.registration} value={<span className="font-['Source_Code_Pro']">{item.config.registration}</span>} />
                    <DetailRow label={adminContent.detail.size} value={details.size} />
                    <DetailRow label={adminContent.detail.innerBorder} value={item.config.innerBorder} />
                    <DetailRow label={adminContent.detail.outerBorder} value={item.config.outerBorder} />
                    {item.config.countryFlag !== "none" ? <DetailRow label={adminContent.detail.flag} value={details.flag} /> : null}
                    {item.config.logo !== "No Logo" ? <DetailRow label={adminContent.detail.logo} value={details.logo} /> : null}
                    <DetailRow label={adminContent.detail.slogan} value={details.slogan} />
                    <DetailRow label={adminContent.detail.fixing} value={details.fixing} />
                    <DetailRow label={adminContent.detail.quantity} value={item.quantity} />
                  </dl>
                </div>
                <div className="mt-4 border-t border-[#e5e7eb] pt-4"><h3 className="text-xs font-semibold">{adminContent.detail.priceBreakdown}</h3><dl className="mt-2 space-y-1.5 text-xs">{item.priceBreakdown.map((line) => <DetailRow key={line.label} label={line.label} value={formatAdminMoney(Math.round(line.amount * item.quantity * 100))} />)}<div className="border-t border-[#e5e7eb] pt-2 font-semibold"><DetailRow label={adminContent.detail.lineTotal} value={formatAdminMoney(item.lineTotalPence)} /></div></dl></div>
              </section>
            );
          })}

          <section className="rounded-lg border border-[#e5e7eb] bg-white p-5"><h2 className="font-semibold">{adminContent.detail.instructions}</h2><p className="mt-3 text-xs text-[#2b2d31]/55">{order.orderNotes || order.items.map((item) => item.config.specialRequirements).filter(Boolean).join(" · ") || adminContent.detail.noInstructions}</p></section>
          <section className="rounded-lg border border-[#e5e7eb] bg-white p-5"><h2 className="font-semibold">{adminContent.detail.uploads}</h2>{order.uploads.length ? <ul className="mt-3 space-y-2 text-xs">{order.uploads.map((upload) => <li className="flex flex-wrap justify-between gap-2 rounded border border-[#e5e7eb] p-3" key={upload.id}><span>{upload.name}</span><span className="text-[#2b2d31]/50">{upload.kind.toUpperCase()} · {upload.sizeLabel}</span></li>)}</ul> : <p className="mt-3 text-xs text-[#2b2d31]/45">{adminContent.detail.noUploads}</p>}</section>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-5">
          <AdminOwnerActions initialCarrier={order.carrier} initialFulfilment={order.fulfilmentStatus} initialNotes={order.privateNotes} initialTracking={order.trackingReference} initialVerification={order.verificationStatus} />
          <section className="rounded-lg border border-[#e5e7eb] bg-white p-5"><h2 className="font-semibold">{adminContent.detail.activity}</h2><ol className="mt-4 space-y-4">{order.timeline.map((event) => <li className="relative pl-5 text-xs" key={event.id}><span className="absolute left-0 top-1 size-2 rounded-full bg-[var(--accent)]" /><p>{event.title}</p><p className="mt-1 text-[0.6875rem] text-[#2b2d31]/45">{event.actor} · {formatAdminDate(event.createdAt, true)}</p></li>)}</ol></section>
        </aside>
      </div>
    </div>
  );
}

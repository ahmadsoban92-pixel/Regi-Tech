"use client";

import { useActionState } from "react";
import { bookRoyalMailAction, dispatchRoyalMailAction, initialAdminActionState, recoverRoyalMailAction } from "@/app/admin/actions";
import type { RoyalMailShipment } from "@/lib/royalMailWorkflow";

function Feedback({ success, message }: { success: boolean; message: string }) {
  return message ? <p aria-live="polite" className={`mt-3 text-xs ${success ? "text-emerald-700" : "text-red-600"}`}>{message}</p> : null;
}

export function AdminRoyalMailShipment({ reference, shipment, eligible, configured, plateCount }: {
  reference: string; shipment: RoyalMailShipment | null; eligible: boolean; configured: boolean; plateCount: number;
}) {
  const [bookState, bookAction, bookPending] = useActionState(bookRoyalMailAction, initialAdminActionState);
  const [recoverState, recoverAction, recoverPending] = useActionState(recoverRoyalMailAction, initialAdminActionState);
  const [dispatchState, dispatchAction, dispatchPending] = useActionState(dispatchRoyalMailAction, initialAdminActionState);
  return (
    <section className="admin-card rounded-lg border border-[#e5e7eb] bg-white p-5">
      <h2 className="font-semibold">Royal Mail shipping</h2>
      {!configured ? <p className="mt-3 text-xs text-amber-700">Click &amp; Drop is not configured on this server yet. Manual carrier and tracking remain available.</p> : null}
      {shipment ? <div className="mt-3 space-y-2 text-xs">
        <p><span className="font-semibold">Status:</span> {shipment.status === "reserved" ? "Booking needs checking" : shipment.status === "booked" ? "Label ready" : "Dispatched"}</p>
        <p><span className="font-semibold">Service:</span> {shipment.serviceCode === "TRS48" ? "Tracked 48 LBT" : "Tracked 48"}</p>
        <p><span className="font-semibold">Packed parcel:</span> {shipment.weightGrams} g · {shipment.lengthMm} × {shipment.widthMm} × {shipment.depthMm} mm</p>
        {shipment.trackingNumber ? <p><span className="font-semibold">Tracking:</span> {shipment.trackingNumber}</p> : null}
      </div> : null}

      {!shipment && configured ? eligible ? <form action={bookAction} className="mt-4 space-y-3" onSubmit={(event) => { if (!window.confirm("Create a Royal Mail label for this packed parcel? Check the weight and dimensions first.")) event.preventDefault(); }}>
        <input name="reference" type="hidden" value={reference} />
        <p className="text-xs text-[#2b2d31]/65">Plate-only estimate: {plateCount * 200} g. Weigh and measure the final packed parcel, including packaging.</p>
        <label className="block text-xs font-medium">Packed weight (g)<input className="admin-light-field mt-1" min="1" max="20000" name="weightGrams" required type="number" /></label>
        <div className="grid grid-cols-3 gap-2">{(["lengthMm", "widthMm", "depthMm"] as const).map((name) => <label className="block text-xs font-medium" key={name}>{name === "lengthMm" ? "Length" : name === "widthMm" ? "Width" : "Depth"} (mm)<input className="admin-light-field mt-1" min="1" name={name} required type="number" /></label>)}</div>
        <p className="text-[0.6875rem] text-[#2b2d31]/55">Up to 750 g and strictly under 300 × 220 × 20 mm uses Tracked 48 LBT; otherwise Tracked 48.</p>
        <button className="admin-primary-action rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#111] disabled:opacity-60" disabled={bookPending} type="submit">{bookPending ? "Booking…" : "Create Royal Mail label"}</button>
        <Feedback {...bookState} />
      </form> : <p className="mt-3 text-xs text-[#2b2d31]/60">Available when the order is paid, verified, and in production.</p> : null}

      {shipment?.status === "reserved" && configured ? <form action={recoverAction} className="mt-4"><input name="reference" type="hidden" value={reference} /><p className="mb-3 text-xs text-amber-700">Check this order reference in Click &amp; Drop. Recovery looks up the existing booking and never creates a second one.</p><button className="admin-primary-action rounded-md border border-[#d1d5db] px-3 py-2 text-xs font-semibold disabled:opacity-60" disabled={recoverPending} type="submit">{recoverPending ? "Checking…" : "Recover booking"}</button><Feedback {...recoverState} /></form> : null}

      {shipment && shipment.status !== "reserved" ? <div className="mt-4 space-y-3">
        <a className="admin-primary-action inline-block rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#111]" href={`/api/v1/admin/orders/${encodeURIComponent(reference)}/royal-mail-label`}>Download label PDF</a>
        {shipment.status === "booked" && configured ? <form action={dispatchAction} onSubmit={(event) => { if (!window.confirm("Has this parcel actually been handed to Royal Mail?")) event.preventDefault(); }}><input name="reference" type="hidden" value={reference} /><button className="admin-primary-action rounded-md border border-[#d1d5db] px-3 py-2 text-xs font-semibold disabled:opacity-60" disabled={dispatchPending || !shipment.trackingNumber} type="submit">{dispatchPending ? "Updating…" : "Mark handed to Royal Mail"}</button>{!shipment.trackingNumber ? <p className="mt-2 text-xs text-amber-700">Tracking is not available yet. Check Click &amp; Drop before dispatch.</p> : null}<Feedback {...dispatchState} /></form> : null}
      </div> : null}
    </section>
  );
}

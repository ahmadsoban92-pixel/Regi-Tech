"use client";

import { useActionState, useEffect, useState } from "react";
import adminContent from "@/content/admin.json";
import type { VerificationStatus } from "@/types/orderApi";
import type { AdminFulfilmentStatus, AdminOrderNote } from "@/types/admin";
import { addOrderNote, cancelAdminOrder, initialAdminActionState, saveOrderControls } from "@/app/admin/actions";

export function AdminOwnerActions({ initialCarrier, initialFulfilment, initialNotes, initialTracking, initialVerification, reference }: {
  initialCarrier: string;
  initialFulfilment: AdminFulfilmentStatus;
  initialNotes: AdminOrderNote[];
  initialTracking: string;
  initialVerification: VerificationStatus;
  reference: string;
}) {
  const [fulfilment, setFulfilment] = useState(initialFulfilment);
  const [verification, setVerification] = useState(initialVerification);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [tracking, setTracking] = useState(initialTracking);
  const [controlsState, controlsAction, controlsPending] = useActionState(saveOrderControls, initialAdminActionState);
  const [noteState, noteAction, notePending] = useActionState(addOrderNote, initialAdminActionState);
  const [cancelState, cancelAction, cancelPending] = useActionState(cancelAdminOrder, initialAdminActionState);
  useEffect(() => { setFulfilment(initialFulfilment); setVerification(initialVerification); setCarrier(initialCarrier); setTracking(initialTracking); }, [initialCarrier, initialFulfilment, initialTracking, initialVerification]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
        <h2 className="font-semibold">{adminContent.detail.ownerActions}</h2>
        <form action={controlsAction} className="mt-4">
          <input name="reference" type="hidden" value={reference} />
          <label className="block text-xs font-medium" htmlFor="fulfilment-status">{adminContent.detail.fulfilmentStatus}<select className="admin-light-field mt-1" id="fulfilment-status" name="fulfilment" onChange={(event) => setFulfilment(event.target.value as AdminFulfilmentStatus)} value={fulfilment}><option value="new">{adminContent.statuses.new}</option><option value="in_production">{adminContent.statuses.in_production}</option><option value="dispatched">{adminContent.statuses.dispatched}</option><option value="cancelled" disabled>{adminContent.statuses.cancelled}</option></select></label>
          <label className="mt-4 block text-xs font-medium" htmlFor="verification-status">{adminContent.detail.verificationStatus}<select className="admin-light-field mt-1" id="verification-status" name="verification" onChange={(event) => setVerification(event.target.value as VerificationStatus)} value={verification}><option value="not_required">{adminContent.statuses.not_required}</option><option value="pending">{adminContent.statuses.pending}</option><option value="approved">{adminContent.statuses.approved}</option><option value="rejected">{adminContent.statuses.rejected}</option></select></label>
          <p className="mt-1 text-[0.6875rem] leading-4 text-[#2b2d31]/50">{adminContent.detail.verificationNote}</p>
          <label className="mt-4 block text-xs font-medium" htmlFor="carrier">{adminContent.detail.carrier}<input className="admin-light-field mt-1" id="carrier" maxLength={100} name="carrier" onChange={(event) => setCarrier(event.target.value)} placeholder={adminContent.detail.carrierPlaceholder} value={carrier} /></label>
          <label className="mt-3 block text-xs font-medium" htmlFor="tracking-reference">{adminContent.detail.tracking}<input className="admin-light-field mt-1" id="tracking-reference" maxLength={120} name="tracking" onChange={(event) => setTracking(event.target.value)} placeholder={adminContent.detail.trackingPlaceholder} value={tracking} /></label>
          <button className="mt-3 rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#111] disabled:opacity-60" disabled={controlsPending || fulfilment === "cancelled"} type="submit">{controlsPending ? "Saving…" : adminContent.detail.saveCarrier}</button>
          {controlsState.message ? <p aria-live="polite" className={`mt-3 text-xs ${controlsState.success ? "text-emerald-700" : "text-red-600"}`}>{controlsState.message}</p> : null}
        </form>
        <form action={cancelAction} className="mt-4 border-t border-[#e5e7eb] pt-3" onSubmit={(event) => { if (!window.confirm(adminContent.detail.cancelConfirm)) event.preventDefault(); }}><input name="reference" type="hidden" value={reference} /><label className="block text-xs font-medium" htmlFor="cancellation-reason">Cancellation reason<input className="admin-light-field mt-1" disabled={fulfilment === "cancelled"} id="cancellation-reason" maxLength={500} minLength={3} name="reason" required /></label><button className="mt-3 rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50" disabled={cancelPending || fulfilment === "cancelled"} type="submit">{cancelPending ? "Cancelling…" : adminContent.detail.cancel}</button>{cancelState.message ? <p aria-live="polite" className={`mt-3 text-xs ${cancelState.success ? "text-emerald-700" : "text-red-600"}`}>{cancelState.message}</p> : null}</form>
      </section>

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
        <h2 className="font-semibold">{adminContent.detail.privateNotes}</h2>
        <form action={noteAction} className="mt-4"><input name="reference" type="hidden" value={reference} /><label className="sr-only" htmlFor="private-note">{adminContent.detail.notePlaceholder}</label><textarea className="admin-light-field min-h-24 resize-y" id="private-note" maxLength={1000} name="note" placeholder={adminContent.detail.notePlaceholder} required /><button className="mt-3 rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#111] disabled:opacity-60" disabled={notePending} type="submit">{notePending ? "Adding…" : adminContent.detail.addNote}</button>{noteState.message ? <p aria-live="polite" className={`mt-3 text-xs ${noteState.success ? "text-emerald-700" : "text-red-600"}`}>{noteState.message}</p> : null}</form>
        <div className="mt-3 border-t border-[#e5e7eb] pt-3">{initialNotes.length ? <ul className="space-y-3">{initialNotes.map((note) => <li className="text-xs" key={note.id}><p>{note.body}</p><p className="mt-1 text-[#2b2d31]/45">{note.author}</p></li>)}</ul> : <p className="text-xs text-[#2b2d31]/45">{adminContent.detail.noNotes}</p>}</div>
      </section>
    </div>
  );
}

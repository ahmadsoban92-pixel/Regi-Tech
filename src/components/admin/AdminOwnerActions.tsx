"use client";

import { FormEvent, useState } from "react";
import adminContent from "@/content/admin.json";
import type { VerificationStatus } from "@/types/orderApi";
import type { AdminFulfilmentStatus, AdminOrderNote } from "@/types/admin";

export function AdminOwnerActions({ initialCarrier, initialFulfilment, initialNotes, initialTracking, initialVerification }: {
  initialCarrier: string;
  initialFulfilment: AdminFulfilmentStatus;
  initialNotes: AdminOrderNote[];
  initialTracking: string;
  initialVerification: VerificationStatus;
}) {
  const [fulfilment, setFulfilment] = useState(initialFulfilment);
  const [verification, setVerification] = useState(initialVerification);
  const [carrier, setCarrier] = useState(initialCarrier);
  const [tracking, setTracking] = useState(initialTracking);
  const [notes, setNotes] = useState(initialNotes);
  const [message, setMessage] = useState("");

  function saveCarrier(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(adminContent.detail.carrierSaved);
  }

  function cancelOrder() {
    if (!window.confirm(adminContent.detail.cancelConfirm)) return;
    setFulfilment("cancelled");
    setMessage(adminContent.detail.cancelled);
  }

  function addNote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const body = String(data.get("note") ?? "").trim();
    if (!body) return;
    setNotes((value) => [...value, { id: `preview-${value.length + 1}`, author: "Owner Admin", body, createdAt: new Date().toISOString() }]);
    form.reset();
  }

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
        <h2 className="font-semibold">{adminContent.detail.ownerActions}</h2>
        <form className="mt-4" onSubmit={saveCarrier}>
          <label className="block text-xs font-medium" htmlFor="fulfilment-status">{adminContent.detail.fulfilmentStatus}<select className="admin-light-field mt-1" id="fulfilment-status" onChange={(event) => setFulfilment(event.target.value as AdminFulfilmentStatus)} value={fulfilment}><option value="new">{adminContent.statuses.new}</option><option value="in_production">{adminContent.statuses.in_production}</option><option value="dispatched">{adminContent.statuses.dispatched}</option><option value="cancelled">{adminContent.statuses.cancelled}</option></select></label>
          <label className="mt-4 block text-xs font-medium" htmlFor="verification-status">{adminContent.detail.verificationStatus}<select className="admin-light-field mt-1" id="verification-status" onChange={(event) => setVerification(event.target.value as VerificationStatus)} value={verification}><option value="not_required">{adminContent.statuses.not_required}</option><option value="pending">{adminContent.statuses.pending}</option><option value="approved">{adminContent.statuses.approved}</option><option value="rejected">{adminContent.statuses.rejected}</option></select></label>
          <p className="mt-1 text-[0.6875rem] leading-4 text-[#2b2d31]/50">{adminContent.detail.verificationNote}</p>
          <label className="mt-4 block text-xs font-medium" htmlFor="carrier">{adminContent.detail.carrier}<input className="admin-light-field mt-1" id="carrier" onChange={(event) => setCarrier(event.target.value)} placeholder={adminContent.detail.carrierPlaceholder} value={carrier} /></label>
          <label className="mt-3 block text-xs font-medium" htmlFor="tracking-reference">{adminContent.detail.tracking}<input className="admin-light-field mt-1" id="tracking-reference" onChange={(event) => setTracking(event.target.value)} placeholder={adminContent.detail.trackingPlaceholder} value={tracking} /></label>
          <button className="mt-3 rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#111]" type="submit">{adminContent.detail.saveCarrier}</button>
        </form>
        <div className="mt-4 border-t border-[#e5e7eb] pt-3"><button className="rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50" onClick={cancelOrder} type="button">{adminContent.detail.cancel}</button></div>
        {message ? <p aria-live="polite" className="mt-3 text-xs text-[#2b2d31]/60">{message}</p> : null}
      </section>

      <section className="rounded-lg border border-[#e5e7eb] bg-white p-5">
        <h2 className="font-semibold">{adminContent.detail.privateNotes}</h2>
        <form className="mt-4" onSubmit={addNote}><label className="sr-only" htmlFor="private-note">{adminContent.detail.notePlaceholder}</label><textarea className="admin-light-field min-h-24 resize-y" id="private-note" maxLength={1000} name="note" placeholder={adminContent.detail.notePlaceholder} /><button className="mt-3 rounded-md bg-[var(--accent)] px-3 py-2 text-xs font-semibold text-[#111]" type="submit">{adminContent.detail.addNote}</button></form>
        <div className="mt-3 border-t border-[#e5e7eb] pt-3">{notes.length ? <ul className="space-y-3">{notes.map((note) => <li className="text-xs" key={note.id}><p>{note.body}</p><p className="mt-1 text-[#2b2d31]/45">{note.author}</p></li>)}</ul> : <p className="text-xs text-[#2b2d31]/45">{adminContent.detail.noNotes}</p>}</div>
      </section>
    </div>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import adminContent from "@/content/admin.json";
import { changeAdminAction, initialAdminUsersActionState, inviteAdminAction, removeAdminAction } from "@/app/admin/(portal)/users/actions";
import type { AdminUserEvent, ManagedAdminUser } from "@/services/adminUsers.service";

function Feedback({ success, message }: { success: boolean; message: string }) {
  return message ? <p aria-live="polite" className={`mt-2 text-sm ${success ? "text-emerald-700" : "text-red-700"}`}>{message}</p> : null;
}

function InviteForm() {
  const [state, action, pending] = useActionState(inviteAdminAction, initialAdminUsersActionState);
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => { if (state.success) form.current?.reset(); }, [state]);
  return (
    <section className="admin-card mt-6 rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm">
      <h2 className="text-lg font-semibold">{adminContent.users.inviteTitle}</h2>
      <p className="mt-1 text-xs text-[#2b2d31]/60">{adminContent.users.ownerHint}</p>
      <form action={action} className="mt-4 grid gap-4 md:grid-cols-[1fr_1fr_160px_auto] md:items-end" ref={form}>
        <label className="text-sm font-medium">{adminContent.users.name}<input className="admin-light-field mt-1" maxLength={100} name="displayName" required /></label>
        <label className="text-sm font-medium">{adminContent.users.email}<input autoComplete="email" className="admin-light-field mt-1" maxLength={254} name="email" required type="email" /></label>
        <label className="text-sm font-medium">{adminContent.users.role}<select className="admin-light-field mt-1" defaultValue="admin" name="role"><option value="admin">{adminContent.users.admin}</option><option value="owner">{adminContent.users.owner}</option></select></label>
        <button className="admin-primary-action min-h-[42px] rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[#111] disabled:opacity-60" disabled={pending} type="submit">{pending ? adminContent.users.inviting : adminContent.users.invite}</button>
      </form>
      <Feedback {...state} />
    </section>
  );
}

function UserRow({ user, currentUserId }: { user: ManagedAdminUser; currentUserId: string }) {
  const [role, setRole] = useState(user.role);
  const [active, setActive] = useState(user.active);
  const [changeState, changeAction, changing] = useActionState(changeAdminAction, initialAdminUsersActionState);
  const [removeState, removeAction, removing] = useActionState(removeAdminAction, initialAdminUsersActionState);
  const self = user.id === currentUserId;
  useEffect(() => { setRole(user.role); setActive(user.active); }, [user.role, user.active]);
  return (
    <li className="admin-list-row rounded-md border border-[#e5e7eb] p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0"><p className="font-semibold">{user.displayName || user.email} {self ? <span className="ml-1 text-xs font-normal text-[#2b2d31]/55">({adminContent.users.you})</span> : null}</p><p className="break-all text-sm text-[#2b2d31]/65">{user.email}</p></div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${user.active ? "bg-emerald-50 text-emerald-800" : "bg-zinc-100 text-zinc-600"}`}>{user.active ? adminContent.users.active : adminContent.users.inactive}</span>
      </div>
      <form action={changeAction} className="mt-4 flex flex-wrap items-end gap-3">
        <input name="userId" type="hidden" value={user.id} />
        <label className="min-w-28 flex-1 text-xs font-medium sm:max-w-40">{adminContent.users.role}<select className="admin-light-field mt-1" disabled={self} name="role" onChange={(event) => setRole(event.target.value as ManagedAdminUser["role"])} value={role}><option value="owner">{adminContent.users.owner}</option><option value="admin">{adminContent.users.admin}</option></select></label>
        <label className="min-w-28 flex-1 text-xs font-medium sm:max-w-40">{adminContent.users.active}<select className="admin-light-field mt-1" disabled={self} name="active" onChange={(event) => setActive(event.target.value === "true")} value={String(active)}><option value="true">{adminContent.users.active}</option><option value="false">{adminContent.users.inactive}</option></select></label>
        {self ? <p className="w-full text-xs text-[#2b2d31]/55">{adminContent.users.lastOwnerHint}</p> : <button className="admin-primary-action min-h-[42px] rounded-md bg-[var(--accent)] px-4 text-sm font-semibold text-[#111] disabled:opacity-60" disabled={changing || (role === user.role && active === user.active)} type="submit">{changing ? adminContent.users.saving : adminContent.users.save}</button>}
      </form>
      {!self ? <form action={removeAction} className="mt-3" onSubmit={(event) => { if (!window.confirm(adminContent.users.removeConfirm)) event.preventDefault(); }}><input name="userId" type="hidden" value={user.id} /><button className="admin-danger-action rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-700 disabled:opacity-50" disabled={removing} type="submit">{removing ? adminContent.users.removing : adminContent.users.remove}</button></form> : null}
      <Feedback {...changeState} /><Feedback {...removeState} />
    </li>
  );
}

export function AdminUsersManager({ users, events, currentUserId }: { users: ManagedAdminUser[]; events: AdminUserEvent[]; currentUserId: string }) {
  return (
    <>
      <InviteForm />
      <section className="admin-section-enter mt-6 rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{adminContent.users.currentUsers} <span className="text-sm font-normal text-[#2b2d31]/55">({users.length})</span></h2>
        <ul className="mt-4 grid gap-3 xl:grid-cols-2">{users.map((user) => <UserRow currentUserId={currentUserId} key={user.id} user={user} />)}</ul>
      </section>
      <section className="admin-section-enter mt-6 rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{adminContent.users.activity}</h2>
        {events.length ? <ol className="mt-4 divide-y divide-[#e5e7eb]">{events.map((event) => <li className="flex flex-wrap justify-between gap-2 py-3 text-sm" key={event.id}><span><strong>{event.actorName}</strong> {event.action.replaceAll("_", " ")} {event.targetEmail}{event.action === "role_changed" && event.previousRole && event.newRole ? ` (${event.previousRole} → ${event.newRole})` : ""}</span><time className="text-[#2b2d31]/55" dateTime={event.createdAt}>{new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/London" }).format(new Date(event.createdAt))}</time></li>)}</ol> : <p className="mt-3 text-sm text-[#2b2d31]/55">{adminContent.users.noActivity}</p>}
      </section>
    </>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import adminContent from "@/content/admin.json";

const links = [
  { href: "/admin", label: adminContent.navigation.dashboard, icon: LayoutDashboard },
  { href: "/admin/orders", label: adminContent.navigation.orders, icon: ClipboardList }
];

function AdminLogo() {
  return (
    <div className="relative h-[65px] w-[200px] shrink-0">
      <Image alt="Regi-Tech" className="object-cover" fill priority sizes="200px" src="/assets/regitech/admin-logo.png" />
    </div>
  );
}

function AdminNavigation({ adminEmail, onNavigate }: { adminEmail: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="Admin" className="flex-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`admin-nav-link mb-1 flex min-h-9 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium ${active ? "admin-nav-link-active bg-[var(--accent)]" : ""}`}
              href={href}
              key={href}
              onClick={onNavigate}
              style={{ color: active ? "#111111" : "#ffffff" }}
            >
              <Icon aria-hidden size={16} strokeWidth={1.7} />{label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="truncate px-3 pb-2 text-xs text-white/45">{adminEmail}</p>
        <form action="/api/v1/admin/logout" method="post"><button className="admin-nav-link flex min-h-9 w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white" onClick={onNavigate} type="submit"><LogOut aria-hidden size={16} strokeWidth={1.7} />{adminContent.navigation.logout}</button></form>
      </div>
    </>
  );
}

export function AdminShell({ adminEmail, children }: { adminEmail: string; children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-dvh bg-[#111] text-[#111] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="admin-sidebar hidden min-h-dvh flex-col bg-[#2b2d31] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <AdminLogo />
        </div>
        <AdminNavigation adminEmail={adminEmail} />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label={adminContent.navigation.closeMenu} className="admin-drawer-overlay absolute inset-0 bg-black/70" onClick={() => setMenuOpen(false)} type="button" />
          <aside className="admin-drawer relative flex h-full w-[min(82vw,280px)] flex-col bg-[#2b2d31] shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <AdminLogo />
              <button aria-label={adminContent.navigation.closeMenu} className="admin-icon-button grid size-10 place-items-center rounded text-white/80" onClick={() => setMenuOpen(false)} type="button"><X aria-hidden size={20} /></button>
            </div>
            <AdminNavigation adminEmail={adminEmail} onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:col-start-2">
        <header className="flex h-16 items-center gap-3 bg-[#111] px-4 text-white md:px-6">
          <button aria-expanded={menuOpen} aria-label={adminContent.navigation.openMenu} className="admin-icon-button grid size-10 place-items-center rounded text-white/80 lg:hidden" onClick={() => setMenuOpen(true)} type="button"><Menu aria-hidden size={21} /></button>
          <strong className="text-base font-semibold">{adminContent.brandTitle}</strong>
          <span className="ml-auto hidden text-sm text-white/65 sm:block">{adminEmail}</span>
        </header>
        <main className="min-h-[calc(100dvh-4rem)] bg-white">{children}</main>
      </div>
    </div>
  );
}

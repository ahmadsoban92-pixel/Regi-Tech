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

function AdminNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <>
      <nav aria-label="Admin" className="flex-1 p-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              aria-current={active ? "page" : undefined}
              className={`mb-1 flex min-h-9 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-[var(--accent)] text-[#111]" : "text-white/80 hover:bg-white/5 hover:text-white"}`}
              href={href}
              key={href}
              onClick={onNavigate}
            >
              <Icon aria-hidden size={16} strokeWidth={1.7} />{label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-white/10 p-3">
        <p className="truncate px-3 pb-2 text-xs text-white/45">{adminContent.email}</p>
        <Link className="flex min-h-9 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/5 hover:text-white" href="/admin/login" onClick={onNavigate}>
          <LogOut aria-hidden size={16} strokeWidth={1.7} />{adminContent.navigation.logout}
        </Link>
      </div>
    </>
  );
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setMenuOpen(false), [pathname]);

  return (
    <div className="min-h-dvh bg-[#111] text-[#111] lg:grid lg:grid-cols-[240px_minmax(0,1fr)]">
      <aside className="hidden min-h-dvh flex-col bg-[#2b2d31] lg:fixed lg:inset-y-0 lg:left-0 lg:flex lg:w-60">
        <div className="flex h-16 items-center border-b border-white/10 px-5">
          <Image alt="Regi-Tech" className="w-[170px] object-contain" height={85} priority src="/assets/regitech/logo.png" style={{ height: "auto" }} width={170} />
        </div>
        <AdminNavigation />
      </aside>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label={adminContent.navigation.closeMenu} className="absolute inset-0 bg-black/70" onClick={() => setMenuOpen(false)} type="button" />
          <aside className="relative flex h-full w-[min(82vw,280px)] flex-col bg-[#2b2d31] shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-white/10 px-4">
              <Image alt="Regi-Tech" className="w-[160px] object-contain" height={80} priority src="/assets/regitech/logo.png" style={{ height: "auto" }} width={160} />
              <button aria-label={adminContent.navigation.closeMenu} className="grid size-10 place-items-center rounded text-white/80 hover:bg-white/10" onClick={() => setMenuOpen(false)} type="button"><X aria-hidden size={20} /></button>
            </div>
            <AdminNavigation onNavigate={() => setMenuOpen(false)} />
          </aside>
        </div>
      ) : null}

      <div className="min-w-0 lg:col-start-2">
        <header className="flex h-16 items-center gap-3 bg-[#111] px-4 text-white md:px-6">
          <button aria-expanded={menuOpen} aria-label={adminContent.navigation.openMenu} className="grid size-10 place-items-center rounded text-white/80 hover:bg-white/10 lg:hidden" onClick={() => setMenuOpen(true)} type="button"><Menu aria-hidden size={21} /></button>
          <strong className="text-base font-semibold">{adminContent.brandTitle}</strong>
          <span className="ml-auto hidden text-sm text-white/65 sm:block">{adminContent.email}</span>
        </header>
        <main className="min-h-[calc(100dvh-4rem)] bg-white">{children}</main>
      </div>
    </div>
  );
}

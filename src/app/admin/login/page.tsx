import type { Metadata } from "next";
import Image from "next/image";
import adminContent from "@/content/admin.json";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export const metadata: Metadata = { title: "Owner Admin" };

export default function AdminLoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-[#111] px-4 py-12">
      <div className="w-full max-w-md md:-translate-y-24">
        <div className="flex flex-col items-center text-center">
          <Image alt="Regi-Tech" className="w-[243px] object-contain" height={128} priority src="/assets/regitech/logo.png" style={{ height: "auto" }} width={243} />
          <h1 className="mt-3 text-2xl font-bold text-white">{adminContent.login.title}</h1>
          <p className="mt-1 text-sm text-white/55">{adminContent.login.subtitle}</p>
        </div>
        <div className="mt-6"><AdminLoginForm /></div>
      </div>
    </main>
  );
}

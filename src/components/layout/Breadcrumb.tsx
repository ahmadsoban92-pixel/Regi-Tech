import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({ current }: { current: string }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-sm text-[var(--muted)]">
      <Link className="hover:text-[var(--foreground)]" href="/">Home</Link>
      <ChevronRight aria-hidden size={14} />
      <span aria-current="page" className="text-[var(--label)]">{current}</span>
    </nav>
  );
}

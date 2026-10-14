import { SiteFooter } from "./SiteFooter";
import { SiteHeader } from "./SiteHeader";
import { WhatsAppButton } from "./WhatsAppButton";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { AnimatedMain } from "@/components/ui/AnimatedMain";

export function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <SiteHeader />
      <AnimatedMain>{children}</AnimatedMain>
      <SiteFooter />
      <WhatsAppButton />
      <CartDrawer />
    </div>
  );
}

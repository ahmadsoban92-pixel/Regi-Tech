import { MessageCircle } from "lucide-react";
import shared from "@/content/shared.json";

export function WhatsAppButton() {
  return (
    <a
      aria-label="Chat with Regi-Tech on WhatsApp"
      className="fixed bottom-5 right-4 z-40 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--accent)] px-4 text-sm font-medium text-[var(--foreground-on-light)] shadow-[0_12px_30px_var(--shadow)] sm:bottom-8 sm:right-8 sm:px-5"
      href="https://wa.me/447438773936"
    >
      <MessageCircle aria-hidden size={19} />
      <span className="hidden sm:inline">{shared.whatsapp}</span>
      <span className="sm:hidden">WhatsApp</span>
    </a>
  );
}

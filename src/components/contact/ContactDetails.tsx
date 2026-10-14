import Image from "next/image";
import content from "@/content/contact.json";

export function ContactDetails() {
  return (
    <div className="space-y-4">
      {content.details.map((item) => (
        <a className="panel motion-card flex min-h-[86px] items-center gap-5 px-5 py-4 transition-colors hover:bg-[var(--surface-hover)]" href={item.href} key={item.label}>
          <Image alt="" aria-hidden height={22} src={item.icon} width={22} />
          <span><strong className="block font-semibold">{item.label}</strong><span className="mt-1 block text-sm text-[var(--muted)]">{item.value}</span></span>
        </a>
      ))}
    </div>
  );
}

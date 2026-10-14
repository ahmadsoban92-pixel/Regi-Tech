import Image from "next/image";
import { CheckCircle2 } from "lucide-react";

type ChoiceCardProps = {
  label: string;
  description?: string;
  price: number;
  selected: boolean;
  onClick: () => void;
  icon?: string;
  badge?: string;
  className?: string;
};

export function ChoiceCard({ badge, className = "", description, icon, label, onClick, price, selected }: ChoiceCardProps) {
  return (
    <button className={`motion-choice relative flex min-h-[68px] w-full items-center gap-3 rounded-md border p-3 text-left ${selected ? "border-[var(--accent)] bg-[var(--accent-soft)]" : "border-[var(--line)] hover:border-[var(--line-strong)]"} ${className}`} onClick={onClick} type="button">
      {icon ? <Image alt="" aria-hidden className="h-5 w-5 object-contain" height={20} src={icon} width={20} /> : null}
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2 text-sm font-semibold">{label}{badge ? <span className="rounded bg-[var(--accent)] px-1.5 py-0.5 text-[0.6rem] text-[var(--foreground-on-light)]">{badge}</span> : null}</span>
        {description ? <span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{description}</span> : null}
      </span>
      <span className="self-start text-xs font-semibold">{price ? `+£${price.toFixed(2)}` : "£0.00"}</span>
      {selected ? <CheckCircle2 aria-hidden className="absolute bottom-2 right-2 text-[var(--accent)]" size={16} /> : null}
    </button>
  );
}

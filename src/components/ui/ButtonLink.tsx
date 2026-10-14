import Link from "next/link";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", className = "" }: ButtonLinkProps) {
  return (
    <Link className={`${variant === "primary" ? "primary-button" : "secondary-button"} ${className}`} href={href}>
      {children}
    </Link>
  );
}

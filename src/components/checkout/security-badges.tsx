import { CreditCard, Lock, Shield, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type SecurityBadgesProps = {
  variant?: "dark" | "light";
  className?: string;
};

const darkBadges = [
  { icon: Shield, label: "SSL" },
  { icon: Lock, label: "PCI DSS" },
  { icon: CreditCard, label: "Stripe" },
  { icon: Zap, label: "Acesso imediato" },
] as const;

const lightBadges = [
  { icon: Shield, label: "SSL 256-bit" },
  { icon: Lock, label: "PCI DSS" },
  { icon: Zap, label: "Processado pela Stripe" },
] as const;

export function SecurityBadges({
  variant = "light",
  className,
}: SecurityBadgesProps) {
  const badges = variant === "dark" ? darkBadges : lightBadges;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 sm:gap-3",
        variant === "dark" ? "text-white/80" : "text-slate-500",
        className,
      )}
    >
      {badges.map((badge) => (
        <span
          key={badge.label}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium sm:text-xs",
            variant === "dark"
              ? "border border-white/15 bg-white/10"
              : "border border-slate-200 bg-slate-50",
          )}
        >
          <badge.icon className="h-3 w-3 shrink-0 opacity-80" />
          {badge.label}
        </span>
      ))}
    </div>
  );
}

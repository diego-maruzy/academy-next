import Link from "next/link";
import { Lock } from "lucide-react";
import { getProgramUpgradeUrl } from "@/lib/student-access";
import { cn } from "@/lib/utils";

type PremiumLockedStateProps = {
  title: string;
  description?: string;
  upgradeUrl?: string | null;
  buttonLabel?: string;
  className?: string;
};

export function PremiumLockedState({
  title,
  description = "Faça upgrade para acessar este programa.",
  upgradeUrl,
  buttonLabel = "Upgrade",
  className,
}: PremiumLockedStateProps) {
  const href = getProgramUpgradeUrl(upgradeUrl);
  const isExternal = href.startsWith("http");

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-2xl border border-white/10",
        "bg-[#0B1220]/90 px-6 py-12 text-center shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        className,
      )}
    >
      <span className="inline-flex rounded-full border border-amber-400/25 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-200">
        Premium
      </span>

      <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/70 text-amber-200">
        <Lock className="h-7 w-7" />
      </div>

      <h2 className="mt-6 text-xl font-semibold text-white sm:text-2xl">{title}</h2>
      <p className="mt-3 max-w-md text-sm leading-6 text-slate-400">{description}</p>

      <Link
        href={href}
        target={isExternal ? "_blank" : undefined}
        rel={isExternal ? "noreferrer" : undefined}
        className="mt-8 inline-flex h-12 min-w-[180px] items-center justify-center rounded-xl bg-emerald-500 px-6 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 active:scale-[0.98]"
      >
        {buttonLabel}
      </Link>
    </div>
  );
}

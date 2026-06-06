import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type PaymentSectionCardProps = {
  title: string;
  icon?: LucideIcon;
  badge?: string;
  children: React.ReactNode;
  className?: string;
};

export function PaymentSectionCard({
  title,
  icon: Icon,
  badge,
  children,
  className,
}: PaymentSectionCardProps) {
  return (
    <section
      className={cn(
        "rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6 md:p-7",
        className,
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-3 sm:mb-6">
        <div className="flex min-w-0 items-center gap-2.5">
          {Icon ? (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Icon className="h-4 w-4" />
            </span>
          ) : null}
          <h3 className="text-base font-semibold text-slate-900 sm:text-lg">
            {title}
          </h3>
        </div>
        {badge ? (
          <span className="shrink-0 text-[11px] font-medium text-slate-500 sm:text-xs">
            {badge}
          </span>
        ) : null}
      </div>
      <div className="grid gap-4 sm:gap-5">{children}</div>
    </section>
  );
}

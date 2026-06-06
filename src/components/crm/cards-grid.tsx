import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CardsGridProps = {
  children: ReactNode;
  className?: string;
};

export function CardsGrid({ children, className }: CardsGridProps) {
  return (
    <div
      className={cn(
        "grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
}

type CardsEmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
};

export function CardsEmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: CardsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 bg-[#0B1220]/50 px-6 py-16 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-lg font-semibold text-white">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
        {description}
      </p>
      <Button type="button" className="mt-6" onClick={onAction}>
        {actionLabel}
      </Button>
    </div>
  );
}

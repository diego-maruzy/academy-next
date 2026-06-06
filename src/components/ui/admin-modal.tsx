"use client";

import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { cn } from "@/lib/utils";

type AdminModalProps = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: "md" | "lg" | "xl";
  labelledBy?: string;
};

const sizeClasses = {
  md: "max-w-2xl",
  lg: "max-w-3xl",
  xl: "max-w-4xl",
};

export function AdminModal({
  open,
  onClose,
  children,
  size = "lg",
  labelledBy,
}: AdminModalProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className={cn(
          "relative flex max-h-[94vh] w-full flex-col overflow-hidden rounded-t-[1.75rem] border border-white/10 bg-slate-950 shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:rounded-[1.75rem]",
          sizeClasses[size],
        )}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.22),transparent_70%)]" />
        {children}
      </div>
    </div>
  );
}

type AdminModalCloseButtonProps = {
  onClose: () => void;
  label?: string;
};

export function AdminModalCloseButton({
  onClose,
  label = "Fechar",
}: AdminModalCloseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClose}
      aria-label={label}
      className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-slate-950/70 text-slate-400 backdrop-blur transition hover:border-white/20 hover:bg-white/10 hover:text-white"
    >
      <X className="h-4 w-4" />
    </button>
  );
}

type AdminModalHeroProps = {
  title: string;
  subtitle?: string;
  initials: string;
  accent?: "blue" | "violet" | "emerald";
  badges?: ReactNode;
  meta?: ReactNode;
};

const accentClasses = {
  blue: "from-blue-500/20 via-blue-400/5 to-transparent text-blue-300",
  violet: "from-violet-500/20 via-violet-400/5 to-transparent text-violet-300",
  emerald: "from-emerald-500/20 via-emerald-400/5 to-transparent text-emerald-300",
};

const avatarClasses = {
  blue: "border-blue-400/30 bg-blue-500/15 text-blue-200 shadow-blue-500/20",
  violet: "border-violet-400/30 bg-violet-500/15 text-violet-200 shadow-violet-500/20",
  emerald: "border-emerald-400/30 bg-emerald-500/15 text-emerald-200 shadow-emerald-500/20",
};

export function AdminModalHero({
  title,
  subtitle,
  initials,
  accent = "blue",
  badges,
  meta,
}: AdminModalHeroProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 border-b border-white/10 bg-gradient-to-br px-6 pb-6 pt-14 sm:px-8",
        accentClasses[accent],
      )}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-xl font-semibold shadow-lg",
              avatarClasses[accent],
            )}
          >
            {initials}
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
              {subtitle}
            </p>
            <h2 id="admin-modal-title" className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {title}
            </h2>
            {badges ? (
              <div className="mt-3 flex flex-wrap items-center gap-2">{badges}</div>
            ) : null}
          </div>
        </div>
        {meta ? <div className="flex flex-wrap gap-2">{meta}</div> : null}
      </div>
    </div>
  );
}

type AdminModalBodyProps = {
  children: ReactNode;
  className?: string;
};

export function AdminModalBody({ children, className }: AdminModalBodyProps) {
  return (
    <div className={cn("min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8", className)}>
      {children}
    </div>
  );
}

type AdminModalFooterProps = {
  children: ReactNode;
};

export function AdminModalFooter({ children }: AdminModalFooterProps) {
  return (
    <div className="shrink-0 border-t border-white/10 bg-slate-950/90 px-6 py-4 backdrop-blur sm:px-8">
      <div className="flex flex-wrap items-center justify-end gap-3">{children}</div>
    </div>
  );
}

type AdminDetailCardProps = {
  label: string;
  value: string;
  icon?: LucideIcon;
  className?: string;
};

export function AdminDetailCard({
  label,
  value,
  icon: Icon,
  className,
}: AdminDetailCardProps) {
  return (
    <div
      className={cn(
        "group rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/15 hover:bg-white/[0.05]",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        {Icon ? (
          <div className="rounded-xl border border-white/10 bg-slate-950/70 p-2 text-slate-400 transition group-hover:text-slate-200">
            <Icon className="h-4 w-4" />
          </div>
        ) : null}
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 break-words text-sm font-medium leading-6 text-white">
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}

type AdminFormSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export function AdminFormSection({
  title,
  description,
  children,
}: AdminFormSectionProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
      <div className="mb-5 border-b border-white/10 pb-4">
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        {description ? (
          <p className="mt-1 text-sm text-slate-400">{description}</p>
        ) : null}
      </div>
      <div className="grid gap-5">{children}</div>
    </section>
  );
}

type AdminContactPillProps = {
  icon: LucideIcon;
  label: string;
  value: string;
};

export function AdminContactPill({
  icon: Icon,
  label,
  value,
}: AdminContactPillProps) {
  return (
    <div className="inline-flex min-w-0 items-center gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 backdrop-blur">
      <div className="rounded-xl bg-white/5 p-2 text-slate-300">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {label}
        </p>
        <p className="truncate text-sm text-white">{value}</p>
      </div>
    </div>
  );
}

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

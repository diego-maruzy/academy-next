"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EntityCardShellProps = {
  initials: string;
  title: string;
  subtitle: string;
  accent?: "blue" | "violet" | "emerald";
  headerBadges?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  onClick?: () => void;
  className?: string;
};

const avatarAccent = {
  blue: "border-blue-400/20 bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-blue-200",
  violet:
    "border-violet-400/20 bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-200",
  emerald:
    "border-emerald-400/20 bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-emerald-200",
};

export function EntityCardField({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
        {label}
      </p>
      <p className="mt-1 line-clamp-2 text-sm font-medium text-slate-200">
        {value}
      </p>
    </div>
  );
}

export function EntityCardShell({
  initials,
  title,
  subtitle,
  accent = "blue",
  headerBadges,
  children,
  footer,
  onClick,
  className,
}: EntityCardShellProps) {
  return (
    <article
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-2xl border border-white/10",
        "bg-[#0B1220]/90 shadow-[0_8px_32px_rgba(0,0,0,0.28)]",
        "transition duration-300 hover:border-white/15 hover:bg-[#0D1526]",
        "hover:shadow-[0_12px_40px_rgba(0,0,0,0.35)]",
        onClick && "cursor-pointer",
        className,
      )}
    >
      <div className="border-b border-white/[0.06] p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-start gap-3">
            <div
              className={cn(
                "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border text-sm font-bold",
                avatarAccent[accent],
              )}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-base font-semibold text-white">
                {title}
              </h3>
              <p className="mt-0.5 line-clamp-1 text-sm text-slate-400">
                {subtitle}
              </p>
            </div>
          </div>
          {headerBadges ? (
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              {headerBadges}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">{children}</div>

      <div
        className="mt-auto border-t border-white/[0.06] bg-white/[0.02] p-4"
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
      >
        {footer}
      </div>
    </article>
  );
}

import { cn } from "@/lib/utils";

type RoleBadgeVariant = "client" | "permission" | "team-role";

type RoleBadgeProps = {
  value: string;
  label?: string;
  variant?: RoleBadgeVariant;
  className?: string;
};

const permissionStyles: Record<string, string> = {
  admin_access:
    "border-violet-400/25 bg-violet-400/10 text-violet-200",
  academy_access:
    "border-blue-400/25 bg-blue-400/10 text-blue-200",
  support_access:
    "border-emerald-400/25 bg-emerald-400/10 text-emerald-200",
  property_access:
    "border-amber-400/25 bg-amber-400/10 text-amber-200",
};

export function RoleBadge({
  value,
  label,
  variant = "client",
  className,
}: RoleBadgeProps) {
  const display = label ?? value;

  const variantStyle =
    variant === "permission"
      ? (permissionStyles[value] ??
        "border-white/10 bg-white/5 text-slate-300")
      : variant === "team-role"
        ? "border-sky-400/20 bg-sky-400/10 text-sky-200"
        : "border-blue-400/20 bg-blue-400/10 text-blue-200";

  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center truncate rounded-full border px-2.5 py-1 text-[11px] font-semibold",
        variantStyle,
        className,
      )}
    >
      {display}
    </span>
  );
}

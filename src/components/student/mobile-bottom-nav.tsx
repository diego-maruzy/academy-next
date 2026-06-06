"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BookOpen,
  Home,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: typeof Home;
};

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Início", href: "/programas", icon: Home },
  { id: "programs", label: "Programas", href: "/programas", icon: BookOpen },
  { id: "progress", label: "Progresso", href: "/programas", icon: Activity },
  { id: "account", label: "Conta", href: "/programas", icon: User },
];

function isNavItemActive(item: NavItem, pathname: string) {
  if (item.id === "home") {
    return pathname === "/programas";
  }

  if (item.id === "programs") {
    return pathname.startsWith("/programas/");
  }

  if (item.id === "account") {
    return pathname.startsWith("/conta");
  }

  return pathname.startsWith(item.href);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "border-t border-white/10 bg-slate-950/90 backdrop-blur-xl",
        "pb-[env(safe-area-inset-bottom)]",
      )}
      aria-label="Navegação principal"
    >
      <div className="mx-auto flex h-[76px] max-w-lg items-stretch justify-around px-2">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item, pathname);
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-1",
                "rounded-xl px-2 py-2 transition active:scale-[0.98]",
                active ? "text-emerald-400" : "text-slate-400",
              )}
            >
              <Icon
                className={cn(
                  "h-5 w-5 transition",
                  active && "text-emerald-400",
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none",
                  active ? "text-emerald-400" : "text-slate-400",
                )}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

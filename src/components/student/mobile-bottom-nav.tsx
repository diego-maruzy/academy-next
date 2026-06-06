"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, Home, Menu, PlaySquare } from "lucide-react";
import { cn } from "@/lib/utils";

const CHECKMATE_MENU_URL = "https://app.checkmateproperty.com/#/dashboard";

type NavItem = {
  id: string;
  label: string;
  href: string;
  icon: typeof Home;
  external?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { id: "home", label: "Início", href: "/programas", icon: Home },
  { id: "programs", label: "Programas", href: "/programas", icon: BookOpen },
  { id: "shorts", label: "Reels", href: "/shorts", icon: PlaySquare },
  { id: "menu", label: "Menu", href: CHECKMATE_MENU_URL, icon: Menu, external: true },
];

function isNavItemActive(item: NavItem, pathname: string) {
  if (item.id === "home") {
    return pathname === "/programas";
  }

  if (item.id === "programs") {
    return pathname.startsWith("/programas/");
  }

  if (item.id === "shorts") {
    return pathname === "/shorts" || pathname.startsWith("/shorts/");
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
      <div className="mx-auto flex h-[60px] max-w-lg items-stretch justify-around px-1.5">
        {NAV_ITEMS.map((item) => {
          const active = isNavItemActive(item, pathname);
          const Icon = item.icon;

          const className = cn(
            "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5",
            "rounded-xl px-1 py-1.5 transition active:scale-[0.98]",
            active ? "text-emerald-400" : "text-slate-400",
          );
          const content = (
            <>
              <Icon
                className={cn(
                  "h-[20px] w-[20px] transition",
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
            </>
          );

          if (item.external) {
            return (
              <a key={item.id} href={item.href} className={className}>
                {content}
              </a>
            );
          }

          return (
            <Link key={item.id} href={item.href} className={className}>
              {content}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

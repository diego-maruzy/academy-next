"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { LayoutGrid } from "lucide-react";
import { useCurrentAdmin } from "@/components/auth/admin-provider";
import { AdminMobileNavSheet } from "@/components/layout/admin-mobile-nav-sheet";
import {
  getAdminMobileNavItems,
  getAdminMobileNavLabel,
  isAdminMobileNavItemActive,
  isAdminMobileOverflowActive,
} from "@/lib/admin-mobile-nav";
import type { AdminPermission } from "@/lib/admin-auth/permissions";
import { getAllowedMenuItemsForAdmin } from "@/lib/admin-auth/permissions";
import { cn } from "@/lib/utils";

export function AdminMobileBottomNav() {
  const pathname = usePathname();
  const admin = useCurrentAdmin();
  const [sheetOpen, setSheetOpen] = useState(false);

  const allowedItems = useMemo(
    () => getAllowedMenuItemsForAdmin(admin),
    [admin],
  );

  const { primaryItems, overflowItems } = useMemo(
    () =>
      getAdminMobileNavItems(
        admin.permission as AdminPermission,
        allowedItems,
      ),
    [admin.permission, allowedItems],
  );

  const showMore = overflowItems.length > 0;
  const moreActive = isAdminMobileOverflowActive(pathname, overflowItems);

  return (
    <>
      <nav
        className={cn(
          "fixed bottom-0 left-0 right-0 z-50 lg:hidden",
          "border-t border-white/10 bg-slate-950/90 backdrop-blur-xl",
          "pb-[env(safe-area-inset-bottom)]",
        )}
        aria-label="Navegação administrativa"
      >
        <div className="mx-auto flex h-[60px] max-w-lg items-stretch justify-around px-1.5">
          {primaryItems.map((item) => {
            const Icon = item.icon;
            const active = isAdminMobileNavItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5",
                  "rounded-xl px-1 py-1.5 transition active:scale-[0.98]",
                  active ? "text-blue-300" : "text-slate-400",
                )}
              >
                <Icon
                  className={cn(
                    "h-[20px] w-[20px] transition",
                    active && "text-blue-300",
                  )}
                  strokeWidth={active ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "max-w-[72px] truncate text-[10px] font-semibold leading-none",
                    active ? "text-blue-300" : "text-slate-400",
                  )}
                >
                  {getAdminMobileNavLabel(item.href, item.title)}
                </span>
              </Link>
            );
          })}

          {showMore ? (
            <button
              type="button"
              aria-label="Abrir menu completo"
              onClick={() => setSheetOpen(true)}
              className={cn(
                "flex min-h-[44px] min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5",
                "rounded-xl px-1 py-1.5 transition active:scale-[0.98]",
                moreActive || sheetOpen ? "text-blue-300" : "text-slate-400",
              )}
            >
              <LayoutGrid
                className={cn(
                  "h-[20px] w-[20px] transition",
                  (moreActive || sheetOpen) && "text-blue-300",
                )}
                strokeWidth={moreActive || sheetOpen ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none",
                  moreActive || sheetOpen ? "text-blue-300" : "text-slate-400",
                )}
              >
                Mais
              </span>
            </button>
          ) : null}
        </div>
      </nav>

      <AdminMobileNavSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        items={overflowItems}
      />
    </>
  );
}

import { AdminHeader } from "@/components/layout/admin-header";
import { AdminMobileBottomNav } from "@/components/layout/admin-mobile-bottom-nav";
import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { cn } from "@/lib/utils";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#050814] text-white">
      <AdminSidebar />
      <div className="lg:pl-72">
        <AdminHeader />
        <main
          className={cn(
            "mx-auto w-full max-w-[1500px] px-4 py-6 sm:px-5 sm:py-8 lg:px-8",
            "pb-[calc(4.75rem+env(safe-area-inset-bottom))] lg:pb-8",
          )}
        >
          {children}
        </main>
      </div>
      <AdminMobileBottomNav />
    </div>
  );
}

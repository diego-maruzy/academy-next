import { AdminHeader } from "@/components/layout/admin-header";
import { AdminSidebar } from "@/components/layout/admin-sidebar";

type AdminShellProps = {
  children: React.ReactNode;
};

export function AdminShell({ children }: AdminShellProps) {
  return (
    <div className="min-h-screen bg-[#050814] text-white">
      <AdminSidebar />
      <div className="lg:pl-72">
        <AdminHeader />
        <main className="mx-auto w-full max-w-[1500px] px-5 py-8 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}

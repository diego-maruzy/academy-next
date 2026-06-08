import { redirect } from "next/navigation";
import { AdminPermissionGuard } from "@/components/auth/admin-permission-guard";
import { AdminProvider } from "@/components/auth/admin-provider";
import { AdminShell } from "@/components/layout/admin-shell";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect("/admin/login?next=/admin");
  }

  return (
    <AdminProvider admin={admin}>
      <AdminShell>
        <AdminPermissionGuard>{children}</AdminPermissionGuard>
      </AdminShell>
    </AdminProvider>
  );
}

import { AdminPermissionGuard } from "@/components/auth/admin-permission-guard";
import { AdminProvider } from "@/components/auth/admin-provider";
import { AdminShell } from "@/components/layout/admin-shell";
import { requireAdminUser } from "@/lib/admin-auth/require-admin";

export default async function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminUser();

  return (
    <AdminProvider admin={admin}>
      <AdminShell>
        <AdminPermissionGuard>{children}</AdminPermissionGuard>
      </AdminShell>
    </AdminProvider>
  );
}

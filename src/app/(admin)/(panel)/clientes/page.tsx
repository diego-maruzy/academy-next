import { Suspense } from "react";
import { ClientsPageContent } from "@/components/clients/clients-page-content";
import { ClientsPageSkeleton } from "@/components/clients/clients-page-skeleton";
import { mapClientRow } from "@/components/clients/types";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { isAdmin } from "@/lib/admin-auth/permissions";
import { getClients } from "@/lib/clients-data";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const [clients, admin] = await Promise.all([getClients(), getCurrentAdmin()]);

  return (
    <Suspense fallback={<ClientsPageSkeleton />}>
      <ClientsPageContent
        initialClients={clients.map(mapClientRow)}
        canImport={isAdmin(admin)}
      />
    </Suspense>
  );
}

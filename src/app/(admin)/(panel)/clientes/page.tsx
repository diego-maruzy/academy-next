import { Suspense } from "react";
import { ClientsPageContent } from "@/components/clients/clients-page-content";
import { mapClientRow } from "@/components/clients/types";
import { getClients } from "@/lib/clients-data";

export const dynamic = "force-dynamic";

export default async function ClientsPage() {
  const clients = await getClients();

  return (
    <Suspense fallback={<p className="text-slate-400">Carregando clientes...</p>}>
      <ClientsPageContent initialClients={clients.map(mapClientRow)} />
    </Suspense>
  );
}

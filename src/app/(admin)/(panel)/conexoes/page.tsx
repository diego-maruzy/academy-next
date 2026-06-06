import { ConnectionsPageContent } from "@/components/connections/connections-page-content";
import { getProgramOptions } from "@/lib/admin-options";
import { getWebhookConnections, getWebhookStats } from "@/lib/webhooks-data";

export const dynamic = "force-dynamic";

export default async function ConnectionsPage() {
  const [webhooks, stats, programs] = await Promise.all([
    getWebhookConnections(),
    getWebhookStats(),
    getProgramOptions(),
  ]);

  return (
    <ConnectionsPageContent
      webhooks={webhooks}
      stats={stats}
      programs={programs}
    />
  );
}

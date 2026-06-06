import { AdminShortsPageContent } from "@/components/admin/shorts/admin-shorts-page-content";
import { getAllShorts } from "@/lib/shorts-data";

export const dynamic = "force-dynamic";

export default async function AdminShortsPage() {
  const shorts = await getAllShorts();

  return <AdminShortsPageContent shorts={shorts} />;
}

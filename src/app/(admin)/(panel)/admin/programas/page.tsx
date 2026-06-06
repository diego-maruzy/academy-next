import { AdminProgramsPageContent } from "@/components/admin/programs/admin-programs-page-content";
import { getPrograms } from "@/lib/academy-data";

export const dynamic = "force-dynamic";

export default async function AdminProgramsPage() {
  const programs = await getPrograms();

  return <AdminProgramsPageContent programs={programs} />;
}

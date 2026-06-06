import { Suspense } from "react";
import { TeamPageContent } from "@/components/team/team-page-content";
import { mapTeamMemberRow } from "@/components/team/types";
import { getTeamMembers } from "@/lib/team-data";

export const dynamic = "force-dynamic";

export default async function TeamPage() {
  const members = await getTeamMembers();

  return (
    <Suspense fallback={<p className="text-slate-400">Carregando equipe...</p>}>
      <TeamPageContent initialMembers={members.map(mapTeamMemberRow)} />
    </Suspense>
  );
}

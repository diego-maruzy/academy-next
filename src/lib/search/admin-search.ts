import { SIDEBAR_ITEMS } from "@/components/layout/sidebar-items";
import { getPrograms } from "@/lib/academy-data";
import { getClients } from "@/lib/clients-data";
import { getTeamMembers } from "@/lib/team-data";

export type AdminSearchResultType =
  | "page"
  | "program"
  | "client"
  | "team_member"
  | "module";

export type AdminSearchResult = {
  id: string;
  type: AdminSearchResultType;
  title: string;
  subtitle?: string;
  href: string;
};

export const ADMIN_SEARCH_TYPE_LABELS: Record<AdminSearchResultType, string> = {
  page: "Página",
  program: "Programa",
  client: "Cliente",
  team_member: "Equipe",
  module: "Módulo",
};

const MAX_RESULTS = 10;

function normalize(text: string) {
  return text.trim().toLowerCase();
}

function matchesQuery(
  query: string,
  ...parts: (string | null | undefined)[]
) {
  return parts.some((part) => part && normalize(part).includes(query));
}

export async function searchAdminContent(
  rawQuery: string,
): Promise<AdminSearchResult[]> {
  const query = normalize(rawQuery);

  if (query.length < 2) {
    return [];
  }

  const results: AdminSearchResult[] = [];

  for (const item of SIDEBAR_ITEMS) {
    if (!item.allowedPermissions.includes("admin_access")) {
      continue;
    }

    if (matchesQuery(query, item.title)) {
      results.push({
        id: item.href,
        type: "page",
        title: item.title,
        subtitle: "Ir para a página",
        href: item.href,
      });
    }
  }

  const [programs, clients, team] = await Promise.all([
    getPrograms(),
    getClients(),
    getTeamMembers(),
  ]);

  for (const program of programs) {
    if (matchesQuery(query, program.name, program.slug)) {
      results.push({
        id: program.id,
        type: "program",
        title: program.name,
        subtitle: program.slug,
        href: `/admin/programas/${program.id}`,
      });
    }

    for (const moduleItem of program.modules) {
      if (matchesQuery(query, moduleItem.name, moduleItem.slug)) {
        results.push({
          id: moduleItem.id,
          type: "module",
          title: moduleItem.name,
          subtitle: program.name,
          href: `/admin/programas/${program.id}/modulos/${moduleItem.id}`,
        });
      }
    }
  }

  for (const client of clients) {
    if (matchesQuery(query, client.full_name, client.email, client.phone)) {
      results.push({
        id: client.id,
        type: "client",
        title: client.full_name,
        subtitle: client.email,
        href: `/clientes?q=${encodeURIComponent(client.email)}`,
      });
    }
  }

  for (const member of team) {
    if (matchesQuery(query, member.full_name, member.email)) {
      results.push({
        id: member.id,
        type: "team_member",
        title: member.full_name,
        subtitle: member.email,
        href: `/equipe?q=${encodeURIComponent(member.email)}`,
      });
    }
  }

  return results.slice(0, MAX_RESULTS);
}

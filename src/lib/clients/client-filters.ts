import type { Client } from "@/components/clients/types";

export type ClientStatusFilter = "all" | "active" | "inactive";
export type ClientPlanFilter = "all" | "free" | "premium";
export type ClientSourceFilter =
  | "all"
  | "import_json"
  | "manual"
  | "checkout"
  | "keycloak"
  | "webhook"
  | "other";
export type ClientSortOption =
  | "recent"
  | "oldest"
  | "name"
  | "last_access";

export function filterAndSortClients(
  clients: Client[],
  options: {
    search: string;
    statusFilter: ClientStatusFilter;
    planFilter: ClientPlanFilter;
    sourceFilter: ClientSourceFilter;
    sortBy: ClientSortOption;
  },
): Client[] {
  const query = options.search.trim().toLowerCase();

  let filtered = clients.filter((client) => {
    const matchesSearch =
      !query ||
      client.fullName.toLowerCase().includes(query) ||
      client.email.toLowerCase().includes(query) ||
      client.phone.toLowerCase().includes(query);

    const matchesStatus =
      options.statusFilter === "all" ||
      (options.statusFilter === "active" && client.status === "active") ||
      (options.statusFilter === "inactive" && client.status !== "active");

    const matchesPlan =
      options.planFilter === "all" ||
      (options.planFilter === "premium" && client.isPremium) ||
      (options.planFilter === "free" && !client.isPremium);

    const matchesSource =
      options.sourceFilter === "all" ||
      client.sourceKey === options.sourceFilter;

    return matchesSearch && matchesStatus && matchesPlan && matchesSource;
  });

  filtered = [...filtered].sort((left, right) => {
    if (options.sortBy === "name") {
      return left.fullName.localeCompare(right.fullName, "pt-BR");
    }

    if (options.sortBy === "oldest") {
      return (
        new Date(left.createdAtRaw).getTime() -
        new Date(right.createdAtRaw).getTime()
      );
    }

    if (options.sortBy === "last_access") {
      const leftTime = left.lastSignInAtRaw
        ? new Date(left.lastSignInAtRaw).getTime()
        : 0;
      const rightTime = right.lastSignInAtRaw
        ? new Date(right.lastSignInAtRaw).getTime()
        : 0;
      return rightTime - leftTime;
    }

    return (
      new Date(right.createdAtRaw).getTime() -
      new Date(left.createdAtRaw).getTime()
    );
  });

  return filtered;
}

export function getClientStats(clients: Client[]) {
  return {
    total: clients.length,
    active: clients.filter((client) => client.status === "active").length,
    free: clients.filter((client) => !client.isPremium).length,
    premium: clients.filter((client) => client.isPremium).length,
  };
}

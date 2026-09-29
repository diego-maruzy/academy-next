import type { ClientAnalytics } from "@/types/client-analytics";

export async function getClientAnalytics(
  clientId: string,
): Promise<ClientAnalytics | null> {
  void clientId;

  return {
    totalTimeSeconds: 0,
    lastAccessAt: null,
    completedLessonsCount: 0,
    accessedPrograms: [],
    completedPrograms: [],
    programProgress: [],
    recentActivity: [],
  };
}

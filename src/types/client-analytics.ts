export type StudentEventType =
  | "platform_access"
  | "program_view"
  | "module_view"
  | "lesson_view"
  | "lesson_completed"
  | "session_heartbeat";

export type AccessedProgramSummary = {
  id: string;
  name: string;
  slug: string;
  firstAccessAt: string;
  lastAccessAt: string;
};

export type CompletedProgramSummary = {
  id: string;
  name: string;
  slug: string;
  completedAt: string | null;
};

export type ProgramProgressSummary = {
  programId: string;
  programName: string;
  programSlug: string;
  totalLessons: number;
  completedLessons: number;
  percentage: number;
  lastAccessAt: string | null;
  status: "completed" | "in_progress" | "not_started";
};

export type RecentActivityItem = {
  id: string;
  eventType: StudentEventType;
  description: string;
  createdAt: string;
  programName: string | null;
  moduleName: string | null;
  lessonName: string | null;
};

export type ClientAnalytics = {
  totalTimeSeconds: number;
  lastAccessAt: string | null;
  completedLessonsCount: number;
  accessedPrograms: AccessedProgramSummary[];
  completedPrograms: CompletedProgramSummary[];
  programProgress: ProgramProgressSummary[];
  recentActivity: RecentActivityItem[];
};

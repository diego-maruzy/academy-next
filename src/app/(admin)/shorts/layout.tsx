import { UserProvider } from "@/components/auth/user-provider";
import { StudentShell } from "@/components/layout/student-shell";
import { StudentSessionTracker } from "@/components/student/student-session-tracker";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentClient } from "@/lib/current-client";

export default async function ShortsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, client] = await Promise.all([
    getCurrentUser(),
    getCurrentClient(),
  ]);

  return (
    <UserProvider user={user}>
      <StudentShell>
        <StudentSessionTracker clientId={client?.id ?? null} />
        {children}
      </StudentShell>
    </UserProvider>
  );
}

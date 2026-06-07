import { UserProvider } from "@/components/auth/user-provider";
import { ReelsShell } from "@/components/reels/reels-shell";
import { StudentSessionTracker } from "@/components/student/student-session-tracker";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentClient } from "@/lib/current-client";

export default async function ReelsLayout({
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
      <ReelsShell>
        <StudentSessionTracker clientId={client?.id ?? null} />
        {children}
      </ReelsShell>
    </UserProvider>
  );
}

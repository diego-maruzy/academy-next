import { StudentSidebar } from "@/components/layout/student-sidebar";
import { MobileBottomNav } from "@/components/student/mobile-bottom-nav";

type ReelsShellProps = {
  children: React.ReactNode;
};

export function ReelsShell({ children }: ReelsShellProps) {
  return (
    <div className="fixed inset-0 z-0 h-[100dvh] overflow-hidden bg-black">
      <StudentSidebar />

      <div className="h-full w-full lg:pl-72">
        <div className="relative mx-auto h-full w-full max-w-[430px] bg-black">
          {children}
        </div>
      </div>

      <MobileBottomNav />
    </div>
  );
}

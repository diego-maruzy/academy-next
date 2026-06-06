import { StudentHeader } from "@/components/layout/student-header";
import { StudentSidebar } from "@/components/layout/student-sidebar";
import { MobileBottomNav } from "@/components/student/mobile-bottom-nav";
import { cn } from "@/lib/utils";

type StudentShellProps = {
  children: React.ReactNode;
};

export function StudentShell({ children }: StudentShellProps) {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050814] text-white">
      <StudentSidebar />
      <div className="min-w-0 lg:pl-72">
        <StudentHeader />
        <main
          className={cn(
            "mx-auto w-full max-w-[1500px] min-w-0 px-4 py-6",
            "pb-[calc(4.5rem+env(safe-area-inset-bottom))]",
            "md:px-5 md:py-8 lg:px-8 lg:pb-8",
          )}
        >
          {children}
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

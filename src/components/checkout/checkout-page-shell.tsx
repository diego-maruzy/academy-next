import { cn } from "@/lib/utils";

type CheckoutPageShellProps = {
  children: React.ReactNode;
  className?: string;
};

export function CheckoutPageShell({
  children,
  className,
}: CheckoutPageShellProps) {
  return (
    <div className={cn("min-h-screen bg-[#F7FAFC] text-slate-900", className)}>
      <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10 md:py-12 lg:px-8 lg:py-14">
        {children}
      </div>
    </div>
  );
}

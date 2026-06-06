import { cn } from "@/lib/utils";

const steps = [
  { id: 1, label: "Cartão" },
  { id: 2, label: "Cobrança" },
  { id: 3, label: "Contato" },
] as const;

export function PaymentStepHeader() {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-[280px] items-center justify-between gap-2 sm:min-w-0 sm:gap-4">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-1 items-center gap-2 sm:gap-3">
            <div className="flex min-w-0 flex-col items-center gap-1.5 sm:flex-row sm:gap-2">
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white sm:h-9 sm:w-9 sm:text-sm",
                  "bg-gradient-to-br from-emerald-500 via-teal-500 to-blue-600 shadow-md shadow-emerald-500/25",
                )}
              >
                {step.id}
              </span>
              <span className="truncate text-[11px] font-semibold text-slate-700 sm:text-sm">
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 ? (
              <div
                className="hidden h-px min-w-[24px] flex-1 bg-gradient-to-r from-emerald-300 via-sky-300 to-blue-300 sm:block"
                aria-hidden
              />
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}

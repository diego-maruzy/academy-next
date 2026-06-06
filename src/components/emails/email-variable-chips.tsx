import { EMAIL_TEMPLATE_VARIABLES } from "@/types/email";
import { cn } from "@/lib/utils";

type EmailVariableChipsProps = {
  onInsert?: (variable: string) => void;
  className?: string;
};

export function EmailVariableChips({
  onInsert,
  className,
}: EmailVariableChipsProps) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {EMAIL_TEMPLATE_VARIABLES.map((variable) => (
        <button
          key={variable}
          type="button"
          onClick={() => onInsert?.(variable)}
          className={cn(
            "rounded-full border border-white/10 bg-slate-950/70 px-3 py-1 font-mono text-xs text-sky-300 transition",
            onInsert && "hover:border-sky-400/30 hover:bg-sky-500/10",
          )}
        >
          {variable}
        </button>
      ))}
    </div>
  );
}

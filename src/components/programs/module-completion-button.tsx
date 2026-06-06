"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toggleLessonCompletedAction } from "@/lib/actions/progress-actions";
import { cn } from "@/lib/utils";

type ModuleCompletionButtonProps = {
  clientId: string | null;
  lessonId: string | null;
  programId?: string | null;
  moduleId?: string | null;
  initialCompleted: boolean;
  programSlug: string;
  moduleSlug: string;
  disabledReason?: string;
};

export function ModuleCompletionButton({
  clientId,
  lessonId,
  programId,
  moduleId,
  initialCompleted,
  programSlug,
  moduleSlug,
  disabledReason,
}: ModuleCompletionButtonProps) {
  const router = useRouter();
  const [completed, setCompleted] = useState(initialCompleted);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const disabled = !clientId || !lessonId || Boolean(disabledReason) || isPending;

  function handleToggle() {
    if (!clientId || !lessonId) {
      return;
    }

    const nextCompleted = !completed;
    setError(null);

    startTransition(async () => {
      const result = await toggleLessonCompletedAction({
        clientId,
        lessonId,
        programId: programId ?? undefined,
        moduleId: moduleId ?? undefined,
        completed: nextCompleted,
        programSlug,
        moduleSlug,
      });

      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar o progresso.");
        return;
      }

      setCompleted(nextCompleted);
      router.refresh();
    });
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant={completed ? "secondary" : "primary"}
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "h-12 w-full min-h-[44px] active:scale-[0.98]",
          completed &&
            "border-emerald-400/20 bg-emerald-400/10 text-emerald-300 hover:bg-emerald-400/15",
          disabled && "opacity-60",
        )}
      >
        <CheckCircle2 className="mr-2 h-4 w-4" />
        {isPending
          ? "Salvando..."
          : completed
            ? "Aula concluída"
            : "Marcar aula como concluída"}
      </Button>
      {disabledReason ? (
        <p className="text-center text-xs text-slate-500">{disabledReason}</p>
      ) : null}
      {error ? (
        <p className="text-center text-xs text-rose-300">{error}</p>
      ) : null}
    </div>
  );
}

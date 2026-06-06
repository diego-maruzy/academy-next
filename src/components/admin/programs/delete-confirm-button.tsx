"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteLesson } from "@/lib/actions/lesson-actions";
import { deleteModule } from "@/lib/actions/module-actions";
import { deleteProgram } from "@/lib/actions/program-actions";

type DeleteConfirmButtonProps =
  | {
      type: "program";
      id: string;
      label?: string;
      redirectTo?: string;
    }
  | {
      type: "module";
      id: string;
      programId: string;
      label?: string;
      redirectTo?: string;
    }
  | {
      type: "lesson";
      id: string;
      moduleId: string;
      label?: string;
      redirectTo?: string;
    };

export function DeleteConfirmButton(props: DeleteConfirmButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.",
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result =
        props.type === "program"
          ? await deleteProgram(props.id)
          : props.type === "module"
            ? await deleteModule(props.id, props.programId)
            : await deleteLesson(props.id, props.moduleId);

      if (!result.success) {
        window.alert(result.error ?? "Não foi possível excluir.");
        return;
      }

      if (props.redirectTo) {
        router.push(props.redirectTo);
      }

      router.refresh();
    });
  }

  return (
    <Button type="button" variant="danger" onClick={handleDelete} disabled={pending}>
      <Trash2 className="mr-2 h-4 w-4" />
      {pending ? "Excluindo..." : props.label ?? "Excluir"}
    </Button>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { deleteShort } from "@/lib/actions/short-actions";
import { Button } from "@/components/ui/button";

type DeleteShortButtonProps = {
  id: string;
  label?: string;
  className?: string;
};

export function DeleteShortButton({
  id,
  label = "Excluir",
  className,
}: DeleteShortButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    const confirmed = window.confirm(
      "Tem certeza que deseja excluir este short? Esta ação não pode ser desfeita.",
    );

    if (!confirmed) {
      return;
    }

    startTransition(async () => {
      const result = await deleteShort(id);

      if (!result.success) {
        window.alert(result.error ?? "Não foi possível excluir.");
        return;
      }

      router.refresh();
    });
  }

  return (
    <Button
      type="button"
      variant="danger"
      className={className}
      onClick={handleDelete}
      disabled={pending}
    >
      <Trash2 className="mr-2 h-4 w-4" />
      {pending ? "Excluindo..." : label}
    </Button>
  );
}

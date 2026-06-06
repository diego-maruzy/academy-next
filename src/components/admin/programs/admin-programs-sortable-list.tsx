"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Loader2 } from "lucide-react";
import { AdminProgramCard } from "@/components/admin/programs/admin-program-card";
import { reorderPrograms } from "@/lib/actions/program-actions";
import type { ProgramWithModules } from "@/types/academy";

type AdminProgramsSortableListProps = {
  programs: ProgramWithModules[];
};

type SortableProgramCardProps = {
  program: ProgramWithModules;
  index: number;
};

function SortableProgramCard({ program, index }: SortableProgramCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: program.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? "z-20" : undefined}>
      <AdminProgramCard
        program={program}
        orderIndex={index}
        isDragging={isDragging}
        dragHandle={
          <button
            type="button"
            className="flex h-10 w-10 shrink-0 cursor-grab items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-400 transition hover:border-blue-400/30 hover:bg-white/10 hover:text-white active:cursor-grabbing"
            aria-label={`Reordenar ${program.name}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        }
      />
    </div>
  );
}

function sortByDisplayOrder(programs: ProgramWithModules[]) {
  return [...programs].sort(
    (left, right) => left.display_order - right.display_order,
  );
}

export function AdminProgramsSortableList({
  programs,
}: AdminProgramsSortableListProps) {
  const [items, setItems] = useState(() => sortByDisplayOrder(programs));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    const previousItems = items;
    const nextItems = arrayMove(items, oldIndex, newIndex).map(
      (program, index) => ({
        ...program,
        display_order: index,
      }),
    );

    setItems(nextItems);
    setError(null);

    startTransition(async () => {
      const result = await reorderPrograms(nextItems.map((program) => program.id));

      if (!result.success) {
        setItems(previousItems);
        setError(result.error ?? "Não foi possível salvar a nova ordem.");
      }
    });
  }

  return (
    <div className="grid gap-3 sm:gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
        <p>Arraste pelo ícone para definir a ordem dos programas na área do aluno.</p>
        {pending ? (
          <span className="inline-flex items-center gap-2 text-sky-300">
            <Loader2 className="h-4 w-4 animate-spin" />
            Salvando ordem...
          </span>
        ) : null}
      </div>

      {error ? (
        <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="grid gap-3 sm:gap-4">
            {items.map((program, index) => (
              <SortableProgramCard
                key={program.id}
                program={program}
                index={index}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

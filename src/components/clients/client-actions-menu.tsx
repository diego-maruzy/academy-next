"use client";

import type { ComponentType } from "react";
import {
  ArrowUpDown,
  Edit3,
  MoreHorizontal,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type ClientActionsMenuProps = {
  onEdit: () => void;
  onDelete: () => void;
  onChangePlan?: () => void;
  onResendAccess?: () => void;
  align?: "left" | "right";
};

type MenuItemProps = {
  icon: ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
};

function MenuItem({ icon: Icon, label, onClick, danger }: MenuItemProps) {
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition",
        danger
          ? "text-red-300 hover:bg-red-500/10"
          : "text-slate-200 hover:bg-white/5",
      )}
      onClick={onClick}
    >
      <Icon className="h-4 w-4 shrink-0 opacity-70" />
      {label}
    </button>
  );
}

export function ClientActionsMenu({
  onEdit,
  onDelete,
  onChangePlan,
  onResendAccess,
  align = "right",
}: ClientActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  function runAction(action: () => void) {
    setOpen(false);
    action();
  }

  return (
    <div className="relative" ref={containerRef}>
      <Button
        type="button"
        variant="ghost"
        className="h-8 w-8 shrink-0 px-0"
        aria-label="Mais ações"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {open ? (
        <div
          className={cn(
            "absolute top-full z-30 mt-1 min-w-[190px] overflow-hidden rounded-xl border border-white/10 bg-[#0B1220] py-1 shadow-2xl shadow-black/40",
            align === "right" ? "right-0" : "left-0",
          )}
        >
          <MenuItem
            icon={Edit3}
            label="Editar"
            onClick={() => runAction(onEdit)}
          />
          <MenuItem
            icon={ArrowUpDown}
            label="Alterar plano"
            onClick={() =>
              runAction(
                onChangePlan ??
                  (() => {
                    window.alert("Funcionalidade em breve.");
                  }),
              )
            }
          />
          <MenuItem
            icon={RefreshCw}
            label="Reenviar acesso"
            onClick={() =>
              runAction(
                onResendAccess ??
                  (() => {
                    window.alert("Funcionalidade em breve.");
                  }),
              )
            }
          />
          <div className="my-1 border-t border-white/10" />
          <MenuItem
            icon={Trash2}
            label="Excluir"
            danger
            onClick={() => runAction(onDelete)}
          />
        </div>
      ) : null}
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { Upload } from "lucide-react";
import { ClientImportPanel } from "@/components/clients/client-import-panel";
import {
  AdminModal,
  AdminModalBody,
  AdminModalCloseButton,
  AdminModalHero,
} from "@/components/ui/admin-modal";

type ClientImportModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ClientImportModal({ open, onClose }: ClientImportModalProps) {
  const router = useRouter();

  return (
    <AdminModal open={open} onClose={onClose} size="lg" labelledBy="import-modal-title">
      <AdminModalCloseButton onClose={onClose} label="Fechar importação" />
      <AdminModalHero
        title="Importar clientes"
        subtitle="Envie um arquivo JSON para criar ou atualizar clientes em lote."
        initials="IM"
        accent="blue"
      />
      <AdminModalBody>
        <ClientImportPanel
          compact
          className="border-0 bg-transparent p-0"
          onSuccess={() => router.refresh()}
        />
      </AdminModalBody>
    </AdminModal>
  );
}

type ClientImportButtonProps = {
  onClick: () => void;
};

export function ClientImportButton({ onClick }: ClientImportButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-semibold text-white transition hover:bg-white/10"
    >
      <Upload className="mr-2 h-4 w-4" />
      Importar clientes
    </button>
  );
}

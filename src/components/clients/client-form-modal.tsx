"use client";

import { useState, useTransition } from "react";
import { Plus, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AdminFormSection,
  AdminModal,
  AdminModalBody,
  AdminModalCloseButton,
  AdminModalFooter,
  AdminModalHero,
  getInitials,
} from "@/components/ui/admin-modal";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import { PhoneInput } from "@/components/ui/phone-input";
import { normalizeUsPhoneForStorage } from "@/lib/phone-us";
import type { ClientInput } from "@/lib/validations/client";
import type { Client } from "./types";
import { mapClientToInput } from "./types";

type ClientFormModalProps = {
  client?: Client | null;
  open: boolean;
  onClose: () => void;
  onSave: (values: ClientInput, clientId?: string) => Promise<string | null>;
};

const emptyValues: ClientInput = {
  full_name: "",
  email: "",
  phone: null,
  status: "active",
  program_id: null,
  role: "ROLE_USER_FREE",
  source: null,
  notes: null,
};

export function ClientFormModal({
  client,
  open,
  onClose,
  onSave,
}: ClientFormModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(client);

  if (!open) {
    return null;
  }

  const values = client ? mapClientToInput(client) : emptyValues;
  const title = isEditing ? "Editar cliente" : "Novo cliente";
  const displayName = client?.fullName || "Cadastro";

  return (
    <AdminModal open labelledBy="admin-modal-title" onClose={onClose} size="lg">
      <AdminModalCloseButton onClose={onClose} label="Fechar formulário de cliente" />

      <AdminModalHero
        title={title}
        subtitle={isEditing ? "Atualização de cadastro" : "Novo cadastro"}
        initials={getInitials(displayName) || "NC"}
        accent="blue"
      />

      <form
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(event) => {
          event.preventDefault();
          setError(null);

          const formData = new FormData(event.currentTarget);

          startTransition(async () => {
            const saveError = await onSave(
              {
                full_name: String(formData.get("full_name") ?? ""),
                email: String(formData.get("email") ?? ""),
                phone: normalizeUsPhoneForStorage(
                  String(formData.get("phone") ?? ""),
                ),
                status: String(formData.get("status")) as ClientInput["status"],
                program_id: client?.programId ?? null,
                role: String(formData.get("role") ?? ""),
                source: String(formData.get("source") ?? "") || null,
                notes: String(formData.get("notes") ?? "") || null,
              },
              client?.id,
            );

            if (saveError) {
              setError(saveError);
            }
          });
        }}
      >
        <AdminModalBody className="grid gap-5">
          <AdminFormSection
            title="Informações pessoais"
            description="Dados principais de contato do cliente."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Nome completo">
                <Input
                  name="full_name"
                  defaultValue={values.full_name}
                  placeholder="Nome completo"
                  required
                />
              </Field>
              <Field label="Email">
                <Input
                  name="email"
                  type="email"
                  defaultValue={values.email}
                  placeholder="email@exemplo.com"
                  required
                />
              </Field>
            </div>
            <Field label="Telefone (EUA)">
              <PhoneInput
                key={`${client?.id ?? "new"}-phone`}
                name="phone"
                defaultValue={values.phone ?? ""}
              />
            </Field>
          </AdminFormSection>

          <AdminFormSection
            title="Role e origem"
            description="Defina a role do cliente e a origem do cadastro."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Role">
                <Select name="role" defaultValue={values.role}>
                  <option value="ROLE_USER">ROLE_USER</option>
                  <option value="ROLE_USER_FREE">ROLE_USER_FREE</option>
                  <option value="academy_access">academy_access</option>
                  <option value="property_access">property_access</option>
                </Select>
              </Field>
              <Field label="Origem">
                <Input
                  name="source"
                  defaultValue={values.source ?? ""}
                  placeholder="Webhook JetFormBuilder"
                />
              </Field>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title="Status"
            description="Situação operacional do cliente."
          >
            <Field label="Status">
              <Select name="status" defaultValue={values.status}>
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="inactive">Inativo</option>
                <option value="blocked">Bloqueado</option>
              </Select>
            </Field>
          </AdminFormSection>

          <AdminFormSection
            title="Observações"
            description="Informações internas sobre o relacionamento com o cliente."
          >
            <Field label="Notas">
              <Textarea
                name="notes"
                defaultValue={values.notes ?? ""}
                placeholder="Contexto, histórico ou próximos passos..."
              />
            </Field>
          </AdminFormSection>

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}
        </AdminModalBody>

        <AdminModalFooter>
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={pending}>
            {isEditing ? (
              <UserRound className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {pending
              ? "Salvando..."
              : isEditing
                ? "Salvar cliente"
                : "Criar cliente"}
          </Button>
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

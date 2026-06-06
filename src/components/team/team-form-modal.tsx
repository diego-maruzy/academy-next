"use client";

import { useState, useTransition } from "react";
import { Plus, UserCog } from "lucide-react";
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
import type { TeamMemberInput } from "@/lib/validations/team";
import type { TeamMember } from "./types";
import { mapTeamMemberToInput } from "./types";

type TeamFormModalProps = {
  member?: TeamMember | null;
  open: boolean;
  onClose: () => void;
  onSave: (values: TeamMemberInput, memberId?: string) => Promise<string | null>;
};

const emptyValues: TeamMemberInput = {
  full_name: "",
  email: "",
  phone: null,
  role: "support",
  permission: "academy_access",
  status: "invited",
  department: null,
  notes: null,
  password: undefined,
  newPassword: undefined,
};

export function TeamFormModal({
  member,
  open,
  onClose,
  onSave,
}: TeamFormModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const isEditing = Boolean(member);

  if (!open) {
    return null;
  }

  const values = member ? mapTeamMemberToInput(member) : emptyValues;
  const title = isEditing ? "Editar membro" : "Novo membro";
  const displayName = member?.fullName || "Equipe";

  return (
    <AdminModal open labelledBy="admin-modal-title" onClose={onClose} size="lg">
      <AdminModalCloseButton onClose={onClose} label="Fechar formulário de membro" />

      <AdminModalHero
        title={title}
        subtitle={isEditing ? "Atualização de membro" : "Novo membro da equipe"}
        initials={getInitials(displayName) || "EQ"}
        accent="violet"
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
                role: String(formData.get("role") ?? ""),
                permission: String(formData.get("permission") ?? ""),
                department: String(formData.get("department") ?? "") || null,
                status: String(formData.get("status")) as TeamMemberInput["status"],
                notes: String(formData.get("notes") ?? "") || null,
                password: isEditing
                  ? undefined
                  : String(formData.get("password") ?? "") || undefined,
                newPassword: isEditing
                  ? String(formData.get("newPassword") ?? "") || undefined
                  : undefined,
              },
              member?.id,
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
            description="Dados básicos de identificação do membro."
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
                  placeholder="email@checkmate.com"
                  required
                />
              </Field>
            </div>
            <Field label="Telefone (EUA)">
              <PhoneInput
                key={`${member?.id ?? "new"}-phone`}
                name="phone"
                defaultValue={values.phone ?? ""}
              />
            </Field>
          </AdminFormSection>

          <AdminFormSection
            title="Função e departamento"
            description="Organize o membro dentro da operação da Academy."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Função">
                <Select name="role" defaultValue={values.role}>
                  <option value="admin">Administrador</option>
                  <option value="content">Conteúdo</option>
                  <option value="support">Suporte</option>
                  <option value="sales">Comercial</option>
                  <option value="finance">Financeiro</option>
                </Select>
              </Field>
              <Field label="Departamento">
                <Input
                  name="department"
                  defaultValue={values.department ?? ""}
                  placeholder="Operação"
                />
              </Field>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title="Senha administrativa"
            description={
              isEditing
                ? "Defina uma nova senha apenas se quiser alterar o acesso ao painel."
                : "Opcional. Se informada, o membro poderá acessar /admin/login."
            }
          >
            {isEditing ? (
              <Field label="Nova senha administrativa">
                <Input
                  name="newPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Deixe em branco para manter a senha atual"
                />
              </Field>
            ) : (
              <Field label="Senha administrativa">
                <Input
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo de 8 caracteres"
                />
              </Field>
            )}
          </AdminFormSection>

          <AdminFormSection
            title="Acesso e status"
            description="Controle de permissão e situação do membro."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Permissão">
                <Select name="permission" defaultValue={values.permission}>
                  <option value="admin_access">admin_access</option>
                  <option value="academy_access">academy_access</option>
                  <option value="property_access">property_access</option>
                  <option value="support_access">support_access</option>
                </Select>
              </Field>
              <Field label="Status">
                <Select name="status" defaultValue={values.status}>
                  <option value="active">Ativo</option>
                  <option value="invited">Convidado</option>
                  <option value="inactive">Inativo</option>
                  <option value="blocked">Bloqueado</option>
                </Select>
              </Field>
            </div>
          </AdminFormSection>

          <AdminFormSection
            title="Observações"
            description="Notas internas sobre responsabilidades e contexto."
          >
            <Field label="Notas">
              <Textarea
                name="notes"
                defaultValue={values.notes ?? ""}
                placeholder="Responsabilidades, contexto ou observações internas..."
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
              <UserCog className="mr-2 h-4 w-4" />
            ) : (
              <Plus className="mr-2 h-4 w-4" />
            )}
            {pending
              ? "Salvando..."
              : isEditing
                ? "Salvar membro"
                : "Criar membro"}
          </Button>
        </AdminModalFooter>
      </form>
    </AdminModal>
  );
}

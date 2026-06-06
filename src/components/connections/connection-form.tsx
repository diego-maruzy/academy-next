"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import type { ProgramOption } from "@/lib/admin-labels";
import { slugify } from "@/lib/slugify";
import type { WebhookConnectionView } from "@/lib/webhooks-data";
import type { WebhookConnectionInput } from "@/lib/validations/webhook";

type ConnectionFormProps = {
  programs: ProgramOption[];
  editingConnection?: WebhookConnectionView | null;
  onCancelEdit?: () => void;
  onSave: (values: WebhookConnectionInput, connectionId?: string) => Promise<{
    error: string | null;
    secretToken?: string;
  }>;
};

const emptyValues: WebhookConnectionInput = {
  name: "",
  slug: "",
  description: null,
  type: "jetformbuilder",
  role: "ROLE_USER_FREE",
  program_id: null,
  status: "active",
  secret_token: null,
};

export function ConnectionForm({
  programs,
  editingConnection,
  onCancelEdit,
  onSave,
}: ConnectionFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [slugTouched, setSlugTouched] = useState(Boolean(editingConnection?.slug));
  const [pending, startTransition] = useTransition();

  const values = editingConnection
    ? {
        name: editingConnection.name,
        slug: editingConnection.slug,
        description: editingConnection.description,
        type: editingConnection.type,
        role: editingConnection.role,
        program_id: editingConnection.program_id,
        status: editingConnection.status as "active" | "inactive",
        secret_token: editingConnection.secret_token,
      }
    : emptyValues;

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-semibold text-white">
          {editingConnection ? "Editar conexão" : "Nova conexão"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          Configure um webhook de entrada para receber leads via POST JSON.
        </p>
      </CardHeader>
      <CardContent>
        <form
          key={editingConnection?.id ?? "new"}
          className="grid gap-5"
          onSubmit={(event) => {
            event.preventDefault();
            setError(null);
            setSuccessMessage(null);

            const formData = new FormData(event.currentTarget);

            startTransition(async () => {
              const result = await onSave(
                {
                  name: String(formData.get("name") ?? ""),
                  slug: String(formData.get("slug") ?? ""),
                  description: String(formData.get("description") ?? "") || null,
                  type: String(formData.get("type") ?? "jetformbuilder"),
                  role: String(formData.get("role") ?? ""),
                  program_id: String(formData.get("program_id") ?? "") || null,
                  status: String(formData.get("status")) as WebhookConnectionInput["status"],
                  secret_token: editingConnection?.secret_token ?? null,
                },
                editingConnection?.id,
              );

              if (result.error) {
                setError(result.error);
                return;
              }

              if (result.secretToken) {
                setSuccessMessage(
                  `Conexão criada. Token gerado: ${result.secretToken}`,
                );
              } else {
                setSuccessMessage("Conexão salva com sucesso.");
              }

              event.currentTarget.reset();
              setSlugTouched(false);
              onCancelEdit?.();
            });
          }}
        >
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nome da conexão">
              <Input
                name="name"
                defaultValue={values.name}
                placeholder="Ex: Lead Premium"
                required
                onChange={(event) => {
                  const nameInput = event.currentTarget;
                  const form = nameInput.form;

                  if (!form || slugTouched) {
                    return;
                  }

                  const slugInput = form.elements.namedItem("slug");

                  if (slugInput instanceof HTMLInputElement) {
                    slugInput.value = slugify(nameInput.value);
                  }
                }}
              />
            </Field>
            <Field label="Slug da URL">
              <Input
                name="slug"
                defaultValue={values.slug}
                placeholder="lead-premium"
                required
                onChange={() => setSlugTouched(true)}
              />
            </Field>
          </div>

          <Field label="Descrição">
            <Textarea
              name="description"
              defaultValue={values.description ?? ""}
              placeholder="Descreva de onde chegam os leads desta conexão"
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Tipo da conexão">
              <Select name="type" defaultValue={values.type}>
                <option value="jetformbuilder">JetFormBuilder</option>
                <option value="checkout">Checkout</option>
                <option value="external_form">Formulário externo</option>
                <option value="other">Outro</option>
              </Select>
            </Field>
            <Field label="Role aplicada">
              <Select name="role" defaultValue={values.role}>
                <option value="ROLE_USER">ROLE_USER</option>
                <option value="ROLE_USER_FREE">ROLE_USER_FREE</option>
                <option value="academy_access">academy_access</option>
                <option value="property_access">property_access</option>
                <option value="admin_access">admin_access</option>
              </Select>
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Programa associado (opcional)">
              <Select name="program_id" defaultValue={values.program_id ?? ""}>
                <option value="">Nenhum</option>
                {programs.map((program) => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={values.status}>
                <option value="active">Ativo</option>
                <option value="inactive">Inativo</option>
              </Select>
            </Field>
          </div>

          {error ? (
            <div className="rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
              {successMessage}
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
            {editingConnection && onCancelEdit ? (
              <Button type="button" variant="secondary" onClick={onCancelEdit}>
                Cancelar edição
              </Button>
            ) : null}
            <Button type="submit" disabled={pending}>
              <Plus className="mr-2 h-4 w-4" />
              {pending
                ? "Salvando..."
                : editingConnection
                  ? "Salvar conexão"
                  : "Criar conexão"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

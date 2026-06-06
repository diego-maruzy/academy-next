import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";

type ModuleFormProps = {
  programId: string;
  mode?: "create" | "edit";
  cancelHref?: string;
  defaultValues?: {
    title?: string;
    description?: string;
    coverUrl?: string;
    order?: number;
    status?: string;
  };
};

export function ModuleForm({
  programId,
  mode = "create",
  cancelHref = `/programas/${programId}`,
  defaultValues,
}: ModuleFormProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form className="grid gap-5">
          <Field label="Nome do módulo">
            <Input
              name="title"
              placeholder="Ex: Fundamentos estratégicos"
              defaultValue={defaultValues?.title}
            />
          </Field>

          <Field label="Descrição">
            <Textarea
              name="description"
              placeholder="Resumo curto do módulo"
              defaultValue={defaultValues?.description}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-3">
            <Field label="URL da capa">
              <Input
                name="coverUrl"
                placeholder="https://..."
                defaultValue={defaultValues?.coverUrl}
              />
            </Field>
            <Field label="Ordem">
              <Input
                name="order"
                type="number"
                min={1}
                defaultValue={defaultValues?.order ?? 1}
              />
            </Field>
            <Field label="Status">
              <Select name="status" defaultValue={defaultValues?.status ?? "Rascunho"}>
                <option>Rascunho</option>
                <option>Publicado</option>
                <option>Arquivado</option>
              </Select>
            </Field>
          </div>

          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
            <ButtonLink href={cancelHref} variant="secondary">
              Cancelar
            </ButtonLink>
            <Button type="button">
              {mode === "edit" ? "Salvar alterações" : "Salvar módulo"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";

type LessonFormProps = {
  programId: string;
  moduleId: string;
  mode?: "create" | "edit";
  cancelHref?: string;
  defaultValues?: {
    title?: string;
    description?: string;
    vimeoUrl?: string;
    ctaLabel?: string;
    ctaUrl?: string;
    order?: number;
    status?: string;
  };
};

export function LessonForm({
  programId,
  moduleId,
  mode = "create",
  cancelHref = `/programas/${programId}/modulos/${moduleId}`,
  defaultValues,
}: LessonFormProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form className="grid gap-5">
          <Field label="Nome da aula">
            <Input
              name="title"
              placeholder="Ex: Boas-vindas e visão geral"
              defaultValue={defaultValues?.title}
            />
          </Field>

          <Field label="Descrição">
            <Textarea
              name="description"
              placeholder="Resumo curto da aula"
              defaultValue={defaultValues?.description}
            />
          </Field>

          <Field label="Link do Vimeo">
            <Input
              name="vimeoUrl"
              placeholder="https://vimeo.com/..."
              defaultValue={defaultValues?.vimeoUrl}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Texto do botão CTA">
              <Input
                name="ctaLabel"
                placeholder="Ex: Baixar workbook"
                defaultValue={defaultValues?.ctaLabel}
              />
            </Field>
            <Field label="URL do botão CTA">
              <Input
                name="ctaUrl"
                placeholder="https://..."
                defaultValue={defaultValues?.ctaUrl}
              />
            </Field>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
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
              {mode === "edit" ? "Salvar alterações" : "Salvar aula"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

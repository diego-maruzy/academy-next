import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";

type ProgramFormProps = {
  mode?: "create" | "edit";
  cancelHref?: string;
  defaultValues?: {
    title?: string;
    slug?: string;
    description?: string;
    coverUrl?: string;
    status?: string;
  };
};

export function ProgramForm({
  mode = "create",
  cancelHref = "/programas",
  defaultValues,
}: ProgramFormProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <form className="grid gap-5">
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Nome do programa">
              <Input
                name="title"
                placeholder="Ex: Growth Masterclass"
                defaultValue={defaultValues?.title}
              />
            </Field>
            <Field label="Slug">
              <Input
                name="slug"
                placeholder="growth-masterclass"
                defaultValue={defaultValues?.slug}
              />
            </Field>
          </div>

          <Field label="Descrição">
            <Textarea
              name="description"
              placeholder="Resumo curto do programa"
              defaultValue={defaultValues?.description}
            />
          </Field>

          <div className="grid gap-5 md:grid-cols-2">
            <Field label="URL da capa">
              <Input
                name="coverUrl"
                placeholder="https://..."
                defaultValue={defaultValues?.coverUrl}
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
              {mode === "edit" ? "Salvar alterações" : "Salvar programa"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

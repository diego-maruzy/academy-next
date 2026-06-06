"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/programs/image-upload-field";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { createModule, updateModule } from "@/lib/actions/module-actions";
import { slugify } from "@/lib/slugify";
import { moduleSchema, type ModuleInput } from "@/lib/validations/module";

type AdminModuleFormProps = {
  programId: string;
  moduleId?: string;
  defaultValues?: Partial<ModuleInput>;
};

export function AdminModuleForm({
  programId,
  moduleId,
  defaultValues,
}: AdminModuleFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug));
  const existingCoverUrl = defaultValues?.cover_image_url ?? null;
  const [coverImageOverride, setCoverImageOverride] = useState<
    string | undefined
  >(undefined);

  const form = useForm<z.input<typeof moduleSchema>, unknown, ModuleInput>({
    resolver: zodResolver(moduleSchema),
    defaultValues: {
      program_id: programId,
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      description: defaultValues?.description ?? "",
      display_order: defaultValues?.display_order ?? 0,
    },
  });

  function onSubmit(values: ModuleInput) {
    setError(null);

    const payload: ModuleInput = {
      ...values,
      cover_image_url:
        coverImageOverride !== undefined
          ? coverImageOverride
          : moduleId
            ? (existingCoverUrl ?? undefined)
            : undefined,
    };

    startTransition(async () => {
      const result = moduleId
        ? await updateModule(moduleId, payload)
        : await createModule(payload);

      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar o módulo.");
        return;
      }

      router.push(`/admin/programas/${programId}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-5 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <input type="hidden" {...form.register("program_id")} />

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nome">
          <Input
            {...form.register("name")}
            placeholder="Nome do módulo"
            onChange={(event) => {
              form.setValue("name", event.target.value);
              if (!slugTouched) {
                form.setValue("slug", slugify(event.target.value));
              }
            }}
          />
          {form.formState.errors.name ? (
            <p className="text-xs text-red-300">{form.formState.errors.name.message}</p>
          ) : null}
        </Field>

        <Field label="Slug">
          <Input
            {...form.register("slug")}
            placeholder="slug-do-modulo"
            onChange={(event) => {
              setSlugTouched(true);
              form.setValue("slug", event.target.value);
            }}
          />
          {form.formState.errors.slug ? (
            <p className="text-xs text-red-300">{form.formState.errors.slug.message}</p>
          ) : null}
        </Field>
      </div>

      <Field label="Descrição">
        <Textarea {...form.register("description")} />
      </Field>

      <ImageUploadField
        label="Capa do módulo"
        currentImageUrl={existingCoverUrl}
        folder="modules"
        onChange={setCoverImageOverride}
        helperText="Novos uploads vão para o bucket program-covers no Supabase Storage."
      />

      <Field label="Ordem">
        <Input type="number" min={0} {...form.register("display_order")} />
      </Field>

      {error ? (
        <div className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-3 border-t border-white/10 pt-5">
        <Button type="button" variant="secondary" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Salvar módulo"}
        </Button>
      </div>
    </form>
  );
}

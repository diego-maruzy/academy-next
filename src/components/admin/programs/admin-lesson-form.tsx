"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/programs/image-upload-field";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { createLesson, updateLesson } from "@/lib/actions/lesson-actions";
import { slugify } from "@/lib/slugify";
import { lessonSchema, type LessonInput } from "@/lib/validations/lesson";

type AdminLessonFormProps = {
  programId: string;
  moduleId: string;
  lessonId?: string;
  defaultValues?: Partial<LessonInput>;
};

export function AdminLessonForm({
  programId,
  moduleId,
  lessonId,
  defaultValues,
}: AdminLessonFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug));
  const existingImageUrl = defaultValues?.image_url ?? null;
  const [imageOverride, setImageOverride] = useState<string | undefined>(
    undefined,
  );

  const form = useForm<z.input<typeof lessonSchema>, unknown, LessonInput>({
    resolver: zodResolver(lessonSchema),
    defaultValues: {
      module_id: moduleId,
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      description: defaultValues?.description ?? "",
      cta_url: defaultValues?.cta_url ?? "",
      cta_text: defaultValues?.cta_text ?? "",
      vimeo_url: defaultValues?.vimeo_url ?? "",
      display_order: defaultValues?.display_order ?? 0,
    },
  });

  function onSubmit(values: LessonInput) {
    setError(null);

    const payload: LessonInput = {
      ...values,
      image_url:
        imageOverride !== undefined
          ? imageOverride
          : lessonId
            ? (existingImageUrl ?? undefined)
            : undefined,
    };

    startTransition(async () => {
      const result = lessonId
        ? await updateLesson(lessonId, payload)
        : await createLesson(payload);

      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar a aula.");
        return;
      }

      router.push(`/admin/programas/${programId}/modulos/${moduleId}`);
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-5 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <input type="hidden" {...form.register("module_id")} />

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nome da aula">
          <Input
            {...form.register("name")}
            placeholder="Nome da aula"
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
            placeholder="slug-da-aula"
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
        label="Imagem da aula"
        currentImageUrl={existingImageUrl}
        folder="lessons"
        onChange={setImageOverride}
        helperText="Novos uploads vão para o bucket program-covers no Supabase Storage."
      />

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Vimeo URL">
          <Input {...form.register("vimeo_url")} placeholder="https://vimeo.com/..." />
        </Field>
        <Field label="Ordem">
          <Input type="number" min={0} {...form.register("display_order")} />
        </Field>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Texto do CTA">
          <Input {...form.register("cta_text")} placeholder="Falar com um Analista" />
        </Field>
        <Field label="URL do CTA">
          <Input {...form.register("cta_url")} placeholder="https://..." />
        </Field>
      </div>

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
          {pending ? "Salvando..." : "Salvar aula"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/programs/image-upload-field";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { createLesson, updateLesson } from "@/lib/actions/lesson-actions";
import {
  resolveLessonMediaType,
  type LessonMediaType,
} from "@/lib/lesson-media";
import { slugify } from "@/lib/slugify";
import { lessonSchema, type LessonInput } from "@/lib/validations/lesson";
import { cn } from "@/lib/utils";

type AdminLessonFormProps = {
  programId: string;
  moduleId: string;
  lessonId?: string;
  defaultValues?: Partial<LessonInput>;
};

function inferInitialMediaType(
  defaultValues?: Partial<LessonInput>,
): LessonMediaType {
  if (
    defaultValues?.media_type === "video" ||
    defaultValues?.media_type === "image"
  ) {
    return defaultValues.media_type;
  }

  return resolveLessonMediaType({
    vimeo_url: defaultValues?.vimeo_url,
    image_url: defaultValues?.image_url,
  });
}

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
      image_url: defaultValues?.image_url ?? undefined,
      media_type: inferInitialMediaType(defaultValues),
      display_order: defaultValues?.display_order ?? 0,
    },
  });

  const mediaType = useWatch({
    control: form.control,
    name: "media_type",
    defaultValue: inferInitialMediaType(defaultValues),
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

      <fieldset className="grid gap-3 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <legend className="px-1 text-sm font-medium text-slate-200">
          Tipo de conteúdo
        </legend>
        <div className="flex flex-wrap gap-4">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="radio"
              value="video"
              {...form.register("media_type")}
              className="h-4 w-4 border-white/20 bg-slate-950 text-emerald-500"
            />
            Vídeo
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
            <input
              type="radio"
              value="image"
              {...form.register("media_type")}
              className="h-4 w-4 border-white/20 bg-slate-950 text-emerald-500"
            />
            Imagem
          </label>
        </div>
        {mediaType === "image" ? (
          <p className="text-sm text-slate-400">
            Esta aula será exibida como imagem estática, sem player de vídeo.
          </p>
        ) : (
          <p className="text-sm text-slate-400">
            Esta aula será exibida com player Vimeo.
          </p>
        )}
      </fieldset>

      {mediaType === "video" ? (
        <Field label="Vimeo URL">
          <Input {...form.register("vimeo_url")} placeholder="https://vimeo.com/..." />
          {form.formState.errors.vimeo_url ? (
            <p className="text-xs text-red-300">
              {form.formState.errors.vimeo_url.message}
            </p>
          ) : null}
        </Field>
      ) : null}

      <div className={cn(mediaType === "image" && "rounded-2xl border border-blue-400/20 bg-blue-500/5 p-4")}>
        <ImageUploadField
          label={mediaType === "image" ? "Imagem da aula (principal)" : "Imagem da aula (opcional)"}
          currentImageUrl={existingImageUrl}
          folder="lessons"
          onChange={(url) => {
            setImageOverride(url);
            form.setValue("image_url", url ?? undefined, {
              shouldValidate: true,
            });
          }}
          helperText={
            mediaType === "image"
              ? "Esta imagem será exibida como conteúdo principal da aula."
              : "Opcional — pode ser usada como fallback visual."
          }
        />
        {mediaType === "image" && form.formState.errors.image_url ? (
          <p className="mt-2 text-xs text-red-300">
            {form.formState.errors.image_url.message}
          </p>
        ) : null}
      </div>

      <Field label="Ordem">
        <Input type="number" min={0} {...form.register("display_order")} />
      </Field>

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

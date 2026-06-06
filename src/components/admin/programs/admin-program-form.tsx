"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";
import { ImageUploadField } from "@/components/admin/programs/image-upload-field";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import { createProgram, updateProgram } from "@/lib/actions/program-actions";
import { slugify } from "@/lib/slugify";
import { programSchema, type ProgramInput } from "@/lib/validations/program";

type AdminProgramFormProps = {
  programId?: string;
  defaultValues?: Partial<ProgramInput>;
};

export function AdminProgramForm({
  programId,
  defaultValues,
}: AdminProgramFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug));
  const existingCoverUrl = defaultValues?.cover_image_url ?? null;
  const [coverImageOverride, setCoverImageOverride] = useState<
    string | undefined
  >(undefined);

  const form = useForm<z.input<typeof programSchema>, unknown, ProgramInput>({
    resolver: zodResolver(programSchema),
    defaultValues: {
      name: defaultValues?.name ?? "",
      slug: defaultValues?.slug ?? "",
      description: defaultValues?.description ?? "",
      published: defaultValues?.published ?? true,
      display_order: defaultValues?.display_order ?? 0,
      is_premium: defaultValues?.is_premium ?? false,
      upgrade_url: defaultValues?.upgrade_url ?? "",
    },
  });

  const isPremium = useWatch({
    control: form.control,
    name: "is_premium",
    defaultValue: defaultValues?.is_premium ?? false,
  });

  function onSubmit(values: ProgramInput) {
    setError(null);

    const payload: ProgramInput = {
      ...values,
      cover_image_url:
        coverImageOverride !== undefined
          ? coverImageOverride
          : programId
            ? (existingCoverUrl ?? undefined)
            : undefined,
    };

    startTransition(async () => {
      const result = programId
        ? await updateProgram(programId, payload)
        : await createProgram(payload);

      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar o programa.");
        return;
      }

      router.push("/admin/programas");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-5 rounded-2xl border border-white/10 bg-white/5 p-6"
    >
      <div className="grid gap-5 md:grid-cols-2">
        <Field label="Nome">
          <Input
            {...form.register("name")}
            placeholder="Nome do programa"
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
            placeholder="slug-do-programa"
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
        label="Capa do programa"
        currentImageUrl={existingCoverUrl}
        folder="programs"
        onChange={setCoverImageOverride}
        helperText="Novos uploads vão para o bucket program-covers no Supabase Storage."
      />

      <Field label="Ordem">
        <Input type="number" min={0} {...form.register("display_order")} />
      </Field>

      <div className="flex flex-wrap gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" {...form.register("published")} />
          Publicado
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-200">
          <input type="checkbox" {...form.register("is_premium")} />
          Premium
        </label>
      </div>

      {isPremium ? (
        <Field label="Link de upgrade">
          <Input
            {...form.register("upgrade_url")}
            placeholder="https://checkmateproperty.com/checkout"
          />
          <p className="mt-2 text-xs text-slate-400">
            Usuários sem acesso ao programa premium serão direcionados para este
            link ao clicar em Upgrade.
          </p>
          {form.formState.errors.upgrade_url ? (
            <p className="mt-1 text-xs text-red-300">
              {form.formState.errors.upgrade_url.message}
            </p>
          ) : null}
        </Field>
      ) : null}

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
          {pending ? "Salvando..." : "Salvar programa"}
        </Button>
      </div>
    </form>
  );
}

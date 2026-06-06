"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useEffect, useMemo, useState, useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { createShort, updateShort } from "@/lib/actions/short-actions";
import { slugify } from "@/lib/slugify";
import {
  detectVideoProvider,
  getVideoEmbedUrl,
} from "@/lib/video-embed";
import { shortSchema, type ShortInput } from "@/lib/validations/short";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/form-controls";
import type { VideoProvider } from "@/types/shorts";

type AdminShortFormProps = {
  shortId?: string;
  defaultValues?: Partial<ShortInput>;
};

export function AdminShortForm({ shortId, defaultValues }: AdminShortFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [slugTouched, setSlugTouched] = useState(Boolean(defaultValues?.slug));

  const form = useForm<z.input<typeof shortSchema>, unknown, ShortInput>({
    resolver: zodResolver(shortSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      slug: defaultValues?.slug ?? "",
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? "",
      video_url: defaultValues?.video_url ?? "",
      video_provider: defaultValues?.video_provider ?? "vimeo",
      thumbnail_url: defaultValues?.thumbnail_url ?? "",
      duration_label: defaultValues?.duration_label ?? "",
      cta_label: defaultValues?.cta_label ?? "Ver programa completo",
      cta_url: defaultValues?.cta_url ?? "/programas",
      published: defaultValues?.published ?? true,
      featured: defaultValues?.featured ?? false,
      display_order: defaultValues?.display_order ?? 0,
    },
  });

  const videoUrl = useWatch({ control: form.control, name: "video_url" });
  const videoProvider = useWatch({
    control: form.control,
    name: "video_provider",
  });
  const thumbnailUrl = useWatch({ control: form.control, name: "thumbnail_url" });
  const title = useWatch({ control: form.control, name: "title" });

  useEffect(() => {
    const detected = detectVideoProvider(videoUrl ?? "");
    if (detected) {
      form.setValue("video_provider", detected);
    }
  }, [videoUrl, form]);

  useEffect(() => {
    if (!slugTouched && title) {
      form.setValue("slug", slugify(title));
    }
  }, [title, slugTouched, form]);

  const embedUrl = useMemo(
    () =>
      getVideoEmbedUrl(
        videoUrl ?? null,
        (videoProvider as VideoProvider) ?? "vimeo",
      ),
    [videoUrl, videoProvider],
  );

  function onSubmit(values: ShortInput) {
    setError(null);

    startTransition(async () => {
      const result = shortId
        ? await updateShort(shortId, values)
        : await createShort(values);

      if (!result.success) {
        setError(result.error ?? "Não foi possível salvar o short.");
        return;
      }

      router.push("/admin/shorts");
      router.refresh();
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="grid gap-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8"
    >
      <div className="grid gap-5">
        <Field label="Título">
          <Input {...form.register("title")} placeholder="Como analisar um deal em 60 segundos" />
        </Field>

        <Field label="Slug">
          <Input
            {...form.register("slug")}
            onChange={(event) => {
              setSlugTouched(true);
              form.setValue("slug", event.target.value);
            }}
          />
        </Field>

        <Field label="Descrição">
          <Textarea {...form.register("description")} className="min-h-24" />
        </Field>

        <Field label="Categoria">
          <Input {...form.register("category")} placeholder="Deal Analysis" />
        </Field>

        <Field label="Link do vídeo">
          <Input
            {...form.register("video_url")}
            placeholder="https://vimeo.com/... ou https://youtube.com/..."
          />
        </Field>

        <Field label="Provider">
          <Select {...form.register("video_provider")}>
            <option value="vimeo">Vimeo</option>
            <option value="youtube">YouTube</option>
          </Select>
        </Field>

        <Field label="Thumbnail URL">
          <Input {...form.register("thumbnail_url")} placeholder="https://..." />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Duração">
            <Input {...form.register("duration_label")} placeholder="00:59" />
          </Field>
          <Field label="Ordem">
            <Input type="number" min={0} {...form.register("display_order")} />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="CTA Label">
            <Input {...form.register("cta_label")} />
          </Field>
          <Field label="CTA URL">
            <Input {...form.register("cta_url")} placeholder="/programas" />
          </Field>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...form.register("published")} />
            Publicado
          </label>
          <label className="inline-flex items-center gap-2 text-sm text-slate-300">
            <input type="checkbox" {...form.register("featured")} />
            Destaque
          </label>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <Button type="submit" disabled={pending}>
            {pending ? "Salvando..." : "Salvar"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => router.push("/admin/shorts")}
          >
            Cancelar
          </Button>
        </div>
      </div>

      <aside className="grid gap-4">
        <div className="rounded-2xl border border-white/10 bg-slate-950/50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
            Preview do vídeo
          </p>
          <div className="relative mt-3 aspect-[9/16] overflow-hidden rounded-2xl border border-white/10 bg-black">
            {embedUrl ? (
              <iframe
                src={embedUrl}
                title="Preview"
                className="absolute inset-0 h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
              />
            ) : typeof thumbnailUrl === "string" && thumbnailUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={thumbnailUrl}
                alt="Thumbnail preview"
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-slate-500">
                Cole um link Vimeo ou YouTube para visualizar o embed.
              </div>
            )}
          </div>
        </div>
      </aside>
    </form>
  );
}

import { z } from "zod";

const optionalUrl = (message: string) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.union([z.url(message), z.null()]).optional(),
  );

const optionalImageUrl = (message: string) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.union([z.url(message), z.null()]).optional(),
  );

const hasText = (value: string | null | undefined) =>
  Boolean(value && String(value).trim());

export const lessonSchema = z
  .object({
    module_id: z.string().min(1, "Informe o módulo."),
    name: z.string().min(2, "Informe o nome da aula."),
    slug: z
      .string()
      .min(2, "Informe o slug.")
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use um slug válido."),
    description: z.string().optional(),
    cta_url: optionalUrl("Informe uma URL válida para o CTA."),
    cta_text: z.string().optional(),
    image_url: optionalImageUrl("Informe uma URL válida para a imagem."),
    vimeo_url: optionalUrl("Informe uma URL válida do Vimeo."),
    media_type: z.enum(["video", "image"]).default("video"),
    display_order: z.coerce.number().int().min(0, "Informe uma ordem válida."),
  })
  .superRefine((data, ctx) => {
    if (data.media_type === "video" && !hasText(data.vimeo_url)) {
      ctx.addIssue({
        code: "custom",
        message: "Informe a URL do Vimeo para aulas em vídeo.",
        path: ["vimeo_url"],
      });
    }

    if (data.media_type === "image" && !hasText(data.image_url)) {
      ctx.addIssue({
        code: "custom",
        message: "Informe a imagem da aula para aulas em formato imagem.",
        path: ["image_url"],
      });
    }
  });

export type LessonInput = z.infer<typeof lessonSchema>;

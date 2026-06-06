import { z } from "zod";

const optionalText = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().nullable().optional(),
);

const optionalUrl = z.preprocess(
  (value) => (value === "" || value === undefined ? null : value),
  z.string().url("Informe uma URL válida.").nullable().optional(),
);

export const shortSchema = z.object({
  title: z.string().min(2, "Informe o título."),
  slug: z
    .string()
    .min(2, "Informe o slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use um slug válido."),
  description: optionalText,
  category: optionalText,
  video_url: z.string().url("Informe uma URL válida do vídeo."),
  video_provider: z.enum(["vimeo", "youtube"]),
  thumbnail_url: optionalUrl,
  duration_label: optionalText,
  cta_label: optionalText,
  cta_url: z.preprocess(
    (value) => (value === "" || value === undefined ? null : value),
    z
      .string()
      .refine(
        (val) => val.startsWith("/") || /^https?:\/\//.test(val),
        "Informe uma URL válida para o CTA.",
      )
      .nullable()
      .optional(),
  ),
  published: z.boolean(),
  featured: z.boolean(),
  display_order: z.coerce.number().int().min(0, "Informe uma ordem válida."),
});

export type ShortInput = z.infer<typeof shortSchema>;

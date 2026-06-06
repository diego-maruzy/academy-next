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

export const lessonSchema = z.object({
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
  display_order: z.coerce.number().int().min(0, "Informe uma ordem válida."),
});

export type LessonInput = z.infer<typeof lessonSchema>;

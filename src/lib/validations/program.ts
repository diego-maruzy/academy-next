import { z } from "zod";

const optionalImageUrl = (message: string) =>
  z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : value),
    z.union([z.url(message), z.null()]).optional(),
  );

export const programSchema = z.object({
  name: z.string().min(2, "Informe o nome do programa."),
  slug: z
    .string()
    .min(2, "Informe o slug.")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use um slug válido."),
  description: z.string().optional(),
  published: z.boolean(),
  display_order: z.coerce.number().int().min(0, "Informe uma ordem válida."),
  is_premium: z.boolean(),
  cover_image_url: optionalImageUrl("Informe uma URL válida para a capa."),
});

export type ProgramInput = z.infer<typeof programSchema>;

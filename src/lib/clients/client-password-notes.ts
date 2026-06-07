import { DEFAULT_CLIENT_PASSWORD } from "@/lib/clients/default-password";

type NotesPayload = {
  import_meta?: Record<string, unknown>;
  [key: string]: unknown;
};

export function mergeDefaultPasswordIntoNotes(
  notes: string | null | undefined,
): string {
  let payload: NotesPayload = {};

  if (notes) {
    try {
      payload = JSON.parse(notes) as NotesPayload;
    } catch {
      payload = { legacy_notes: notes };
    }
  }

  const importMeta = {
    ...(payload.import_meta ?? {}),
    default_password: DEFAULT_CLIENT_PASSWORD,
  };

  return JSON.stringify({
    ...payload,
    import_meta: importMeta,
  });
}

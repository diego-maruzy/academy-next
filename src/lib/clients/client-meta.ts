import type { ClientRow } from "@/lib/clients-data";

type ImportMeta = {
  has_accessed?: boolean;
  last_sign_in_at?: string | null;
};

export function parseClientImportMeta(
  notes: string | null | undefined,
): ImportMeta {
  if (!notes) {
    return {};
  }

  try {
    const parsed = JSON.parse(notes) as { import_meta?: ImportMeta };
    return parsed.import_meta ?? {};
  } catch {
    return {};
  }
}

export function resolveClientLastSignInAt(row: ClientRow): string | null {
  if (row.last_login_at) {
    return row.last_login_at;
  }

  return parseClientImportMeta(row.notes).last_sign_in_at ?? null;
}

export type ClientSourceKey =
  | "all"
  | "import_json"
  | "manual"
  | "checkout"
  | "webhook"
  | "other";

export function getClientSourceKey(
  source: string | null | undefined,
): Exclude<ClientSourceKey, "all"> {
  const value = source?.trim().toLowerCase() ?? "";

  if (!value) {
    return "manual";
  }

  if (value === "import:json") {
    return "import_json";
  }

  if (value.includes("checkout")) {
    return "checkout";
  }

  if (value.includes("webhook") || value.includes("jet")) {
    return "webhook";
  }

  return "other";
}

export function formatClientSourceLabel(
  source: string | null | undefined,
): string {
  const key = getClientSourceKey(source);

  if (key === "import_json") return "Importação JSON";
  if (key === "manual") return "Cadastro manual";
  if (key === "checkout") return "Checkout";
  if (key === "webhook") return source ?? "Webhook";

  return source?.trim() || "—";
}

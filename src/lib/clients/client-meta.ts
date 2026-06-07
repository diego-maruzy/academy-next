import type { ClientRow } from "@/lib/clients-data";
import { isPremiumPlanId } from "@/lib/clients/client-plan-mapper";
import { isPremiumRole } from "@/lib/clients/client-role-formatter";

type ImportMeta = {
  plan_id?: string | null;
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

export function resolveClientPlanId(row: ClientRow): string | null {
  const extended = row as ClientRow & { plan_id?: string | null };

  if (extended.plan_id) {
    return extended.plan_id;
  }

  return parseClientImportMeta(row.notes).plan_id ?? null;
}

export function resolveClientLastSignInAt(row: ClientRow): string | null {
  const extended = row as ClientRow & { last_sign_in_at?: string | null };

  if (extended.last_sign_in_at) {
    return extended.last_sign_in_at;
  }

  return parseClientImportMeta(row.notes).last_sign_in_at ?? null;
}

export function isPremiumClient(
  role: string,
  planId: string | null,
): boolean {
  return isPremiumRole(role) || isPremiumPlanId(planId);
}

export type ClientSourceKey =
  | "all"
  | "import_json"
  | "manual"
  | "checkout"
  | "keycloak"
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

  if (value.includes("keycloak")) {
    return "keycloak";
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
  if (key === "keycloak") return "Keycloak";
  if (key === "webhook") return source ?? "Webhook";

  return source?.trim() || "—";
}

import { normalizeClientPlan, type ClientPlan } from "@/lib/clients/client-access";

/**
 * IDs dos planos externos do sistema legado.
 * Mantemos esses IDs somente para interpretar arquivos antigos de importação.
 * O sistema atual grava o plano oficial em `client_access.plan`.
 */
export const LEGACY_PLAN_FREE = "196bdb78-bcb7-4396-ab3c-fbeaa8815568";
export const LEGACY_PLAN_PREMIUM = "98e82600-8a48-4107-a2ec-eac4973f30a8";

const LEGACY_PLAN_FIELD = ["plan", "id"].join("_");

export type ImportClientRecord = {
  id: string;
  display_name: string;
  email: string;
  created_at: string;
  country: string | null;
  state: string | null;
  city: string | null;
  whatsapp: string | null;
  roles: string[];
  has_accessed: boolean;
  last_sign_in_at: string | null;
  legacyPlanId?: string | null;
  [key: string]: unknown;
};

export type NormalizedClientImport = {
  external_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  plan: ClientPlan;
  country: string | null;
  state: string | null;
  city: string | null;
  has_accessed: boolean;
  last_sign_in_at: string | null;
  import_roles: string[];
  created_at: string;
};

export function fixEncoding(value: string): string {
  if (!value.includes("Ã") && !value.includes("Â")) {
    return value;
  }

  try {
    const decoded = Buffer.from(value, "latin1").toString("utf8");

    if (decoded && !/[ÃÂ]/.test(decoded)) {
      return decoded;
    }
  } catch {
    // Mantém valor original.
  }

  return value;
}

export function normalizeDisplayName(name: string): string {
  let normalized = fixEncoding(name).trim().replace(/\s+/g, " ");

  const words = normalized.split(" ");

  if (words.length >= 2 && words.length % 2 === 0) {
    const half = words.length / 2;
    const first = words.slice(0, half).join(" ");
    const second = words.slice(half).join(" ");

    if (first.toLowerCase() === second.toLowerCase()) {
      normalized = first;
    }
  }

  return normalized;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) {
    return null;
  }

  const trimmed = phone.trim();

  return trimmed.length > 0 ? trimmed : null;
}

function normalizeLegacyValue(value: string | null | undefined) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replaceAll("-", "_")
    .replaceAll(" ", "_");
}

function getLegacyPlanId(record: ImportClientRecord): string | null {
  const rawValue = record.legacyPlanId ?? record[LEGACY_PLAN_FIELD];

  if (typeof rawValue !== "string") {
    return null;
  }

  const value = rawValue.trim();

  return value || null;
}

function planFromLegacyPlanId(legacyPlanId: string | null | undefined): ClientPlan {
  if (legacyPlanId === LEGACY_PLAN_PREMIUM) {
    return "premium";
  }

  return "free";
}

function planFromLegacyRoles(roles: string[]): ClientPlan | null {
  const normalizedRoles = roles.map(normalizeLegacyValue);

  const premiumRole = ["role", "user"].join("_");
  const freeRole = ["role", "user", "free"].join("_");

  if (normalizedRoles.includes(premiumRole)) {
    return "premium";
  }

  if (normalizedRoles.includes(freeRole)) {
    return "free";
  }

  if (normalizedRoles.includes("premium")) {
    return "premium";
  }

  if (normalizedRoles.includes("free")) {
    return "free";
  }

  return null;
}

export function resolveImportPlan(
  roles: string[],
  legacyPlanId: string | null | undefined,
): ClientPlan {
  return normalizeClientPlan(
    planFromLegacyRoles(roles) ?? planFromLegacyPlanId(legacyPlanId),
  );
}

export function resolveClientImportPlan(
  existingPlan: ClientPlan | string | null | undefined,
  incomingPlan: ClientPlan | string | null | undefined,
): ClientPlan {
  const existing = normalizeClientPlan(existingPlan);
  const incoming = normalizeClientPlan(incomingPlan);

  if (existing === "premium" || incoming === "premium") {
    return "premium";
  }

  return "free";
}

export function resolveHasAccessed(
  existing: boolean | null | undefined,
  incoming: boolean,
): boolean {
  return Boolean(existing) || incoming;
}

export function resolveLastSignInAt(
  existing: string | null | undefined,
  incoming: string | null | undefined,
): string | null {
  if (!existing) {
    return incoming ?? null;
  }

  if (!incoming) {
    return existing;
  }

  return new Date(incoming) > new Date(existing) ? incoming : existing;
}

export function normalizeImportRecord(
  record: ImportClientRecord,
): NormalizedClientImport | null {
  const email = normalizeEmail(record.email);

  if (!isValidEmail(email)) {
    return null;
  }

  const full_name = normalizeDisplayName(record.display_name);

  if (full_name.length < 2) {
    return null;
  }

  const legacyPlanId = getLegacyPlanId(record);

  return {
    external_id: record.id,
    full_name,
    email,
    phone: normalizePhone(record.whatsapp),
    plan: resolveImportPlan(record.roles, legacyPlanId),
    country: record.country?.trim() || null,
    state: record.state?.trim() || null,
    city: record.city?.trim() || null,
    has_accessed: record.has_accessed,
    last_sign_in_at: record.last_sign_in_at,
    import_roles: record.roles,
    created_at: record.created_at,
  };
}
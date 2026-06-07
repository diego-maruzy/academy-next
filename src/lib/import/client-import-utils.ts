/** Planos externos do sistema legado (Keycloak). */
export const LEGACY_PLAN_FREE = "196bdb78-bcb7-4396-ab3c-fbeaa8815568";
export const LEGACY_PLAN_PREMIUM = "98e82600-8a48-4107-a2ec-eac4973f30a8";

export type ClientRole = "ROLE_USER" | "ROLE_USER_FREE";

const ROLE_PRIORITY: Record<ClientRole, number> = {
  ROLE_USER: 2,
  ROLE_USER_FREE: 1,
};

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
  plan_id: string;
  has_accessed: boolean;
  last_sign_in_at: string | null;
};

export type NormalizedClientImport = {
  external_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: ClientRole;
  plan_id: string;
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
    // mantém valor original
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
  if (!phone) return null;
  const trimmed = phone.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function roleFromLegacyRoles(roles: string[]): ClientRole | null {
  const normalized = roles.map((role) => role.trim().toUpperCase());

  if (normalized.includes("ROLE_USER")) {
    return "ROLE_USER";
  }

  if (normalized.includes("ROLE_USER_FREE")) {
    return "ROLE_USER_FREE";
  }

  return null;
}

export function roleFromPlanId(planId: string | null | undefined): ClientRole {
  if (planId === LEGACY_PLAN_PREMIUM) {
    return "ROLE_USER";
  }

  return "ROLE_USER_FREE";
}

export function resolveImportRole(
  roles: string[],
  planId: string | null | undefined,
): ClientRole {
  return roleFromLegacyRoles(roles) ?? roleFromPlanId(planId);
}

export function resolveClientRole(
  existingRole: string | null | undefined,
  incomingRole: ClientRole,
): ClientRole {
  const existing = (existingRole?.trim().toUpperCase() ?? "") as ClientRole;
  const existingPriority = ROLE_PRIORITY[existing] ?? 0;
  const incomingPriority = ROLE_PRIORITY[incomingRole] ?? 0;

  return existingPriority >= incomingPriority ? existing || incomingRole : incomingRole;
}

export function resolvePlanId(
  existingPlanId: string | null | undefined,
  incomingPlanId: string | null | undefined,
): string | null {
  if (existingPlanId === LEGACY_PLAN_PREMIUM) {
    return LEGACY_PLAN_PREMIUM;
  }

  if (incomingPlanId === LEGACY_PLAN_PREMIUM) {
    return LEGACY_PLAN_PREMIUM;
  }

  return incomingPlanId ?? existingPlanId ?? LEGACY_PLAN_FREE;
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
  if (!existing) return incoming ?? null;
  if (!incoming) return existing;

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

  return {
    external_id: record.id,
    full_name,
    email,
    phone: normalizePhone(record.whatsapp),
    role: resolveImportRole(record.roles, record.plan_id),
    plan_id: record.plan_id || LEGACY_PLAN_FREE,
    country: record.country?.trim() || null,
    state: record.state?.trim() || null,
    city: record.city?.trim() || null,
    has_accessed: record.has_accessed,
    last_sign_in_at: record.last_sign_in_at,
    import_roles: record.roles,
    created_at: record.created_at,
  };
}

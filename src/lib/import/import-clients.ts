import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CLIENT_PASSWORD } from "@/lib/clients/default-password";
import { supportsDefaultPasswordColumn } from "@/lib/clients/client-password-storage";
import {
  normalizeImportRecord,
  resolveClientRole,
  resolveHasAccessed,
  resolveLastSignInAt,
  resolvePlanId,
  type ImportClientRecord,
  type NormalizedClientImport,
} from "@/lib/import/client-import-utils";
import { importClientsPayloadSchema } from "@/lib/validations/client-import";

export type ClientImportError = {
  email: string;
  message: string;
};

export type ClientImportSummary = {
  success: boolean;
  total: number;
  created: number;
  updated: number;
  skipped: number;
  errors: ClientImportError[];
};

type ImportMode = "extended" | "legacy";

type ImportMeta = {
  external_id?: string;
  plan_id?: string | null;
  country?: string | null;
  state?: string | null;
  city?: string | null;
  roles?: string[];
  has_accessed?: boolean;
  last_sign_in_at?: string | null;
  created_at?: string;
  default_password?: string;
};

type ExistingClientRow = {
  id: string;
  email: string;
  role: string;
  phone?: string | null;
  notes: string | null;
  plan_id?: string | null;
  has_accessed?: boolean | null;
  last_sign_in_at?: string | null;
  created_at: string;
};

function parseImportMeta(notes: string | null | undefined): ImportMeta {
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

function buildImportNotes(record: NormalizedClientImport): string {
  return JSON.stringify({
    import_meta: {
      external_id: record.external_id,
      plan_id: record.plan_id,
      country: record.country,
      state: record.state,
      city: record.city,
      roles: record.import_roles,
      has_accessed: record.has_accessed,
      last_sign_in_at: record.last_sign_in_at,
      created_at: record.created_at,
      default_password: DEFAULT_CLIENT_PASSWORD,
    } satisfies ImportMeta,
  });
}

function withOptionalDefaultPasswordColumn<T extends Record<string, unknown>>(
  payload: T,
  hasPasswordColumn: boolean,
): T & { default_password?: string } {
  if (!hasPasswordColumn) {
    return payload;
  }

  return {
    ...payload,
    default_password: DEFAULT_CLIENT_PASSWORD,
  };
}

function buildExtendedInsertPayload(
  record: NormalizedClientImport,
  hasPasswordColumn: boolean,
) {
  return withOptionalDefaultPasswordColumn(
    {
      external_id: record.external_id,
      full_name: record.full_name,
      email: record.email,
      phone: record.phone,
      role: record.role,
      status: "active" as const,
      source: "import:json",
      program_id: null,
      notes: buildImportNotes(record),
      country: record.country,
      state: record.state,
      city: record.city,
      plan_id: record.plan_id,
      has_accessed: record.has_accessed,
      last_sign_in_at: record.last_sign_in_at,
      import_roles: record.import_roles,
      created_at: record.created_at,
      updated_at: new Date().toISOString(),
    },
    hasPasswordColumn,
  );
}

function buildLegacyInsertPayload(
  record: NormalizedClientImport,
  hasPasswordColumn: boolean,
) {
  return withOptionalDefaultPasswordColumn(
    {
      full_name: record.full_name,
      email: record.email,
      phone: record.phone,
      role: record.role,
      status: "active" as const,
      source: "import:json",
      program_id: null,
      notes: buildImportNotes(record),
      created_at: record.created_at,
      updated_at: new Date().toISOString(),
    },
    hasPasswordColumn,
  );
}

function buildExtendedUpdatePayload(
  existing: ExistingClientRow,
  record: NormalizedClientImport,
  hasPasswordColumn: boolean,
) {
  return withOptionalDefaultPasswordColumn(
    {
      external_id: record.external_id,
      full_name: record.full_name,
      email: record.email,
      phone: record.phone,
      role: resolveClientRole(existing.role, record.role),
      status: "active" as const,
      source: "import:json",
      notes: buildImportNotes(record),
      country: record.country,
      state: record.state,
      city: record.city,
      plan_id: resolvePlanId(existing.plan_id ?? null, record.plan_id),
      has_accessed: resolveHasAccessed(
        existing.has_accessed,
        record.has_accessed,
      ),
      last_sign_in_at: resolveLastSignInAt(
        existing.last_sign_in_at ?? null,
        record.last_sign_in_at,
      ),
      import_roles: record.import_roles,
      updated_at: new Date().toISOString(),
    },
    hasPasswordColumn,
  );
}

function buildLegacyUpdatePayload(
  existing: ExistingClientRow,
  record: NormalizedClientImport,
  hasPasswordColumn: boolean,
) {
  const meta = parseImportMeta(existing.notes);

  return withOptionalDefaultPasswordColumn(
    {
      full_name: record.full_name,
      email: record.email,
      phone: record.phone ?? existing.phone ?? null,
      role: resolveClientRole(existing.role, record.role),
      status: "active" as const,
      source: "import:json",
      notes: JSON.stringify({
        import_meta: {
          ...meta,
          external_id: record.external_id,
          plan_id: resolvePlanId(meta.plan_id ?? null, record.plan_id),
          country: record.country,
          state: record.state,
          city: record.city,
          roles: record.import_roles,
          has_accessed: resolveHasAccessed(
            meta.has_accessed,
            record.has_accessed,
          ),
          last_sign_in_at: resolveLastSignInAt(
            meta.last_sign_in_at ?? null,
            record.last_sign_in_at,
          ),
          default_password: DEFAULT_CLIENT_PASSWORD,
        } satisfies ImportMeta,
      }),
      updated_at: new Date().toISOString(),
    },
    hasPasswordColumn,
  );
}

async function detectImportMode(
  supabase: SupabaseClient,
): Promise<ImportMode> {
  const { error } = await supabase.from("clients").select("plan_id").limit(1);

  if (error?.message?.includes("does not exist")) {
    return "legacy";
  }

  return "extended";
}

async function getExistingClientByEmail(
  supabase: SupabaseClient,
  email: string,
  mode: ImportMode,
): Promise<ExistingClientRow | null> {
  const columns =
    mode === "extended"
      ? "id, email, role, notes, plan_id, has_accessed, last_sign_in_at, created_at"
      : "id, email, role, phone, notes, created_at";

  const { data, error } = await supabase
    .from("clients")
    .select(columns)
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ExistingClientRow | null) ?? null;
}

export async function importClientsFromRecords(
  supabase: SupabaseClient,
  rawRecords: unknown,
): Promise<ClientImportSummary> {
  const summary: ClientImportSummary = {
    success: true,
    total: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const parsed = importClientsPayloadSchema.safeParse(rawRecords);

  if (!parsed.success) {
    return {
      ...summary,
      success: false,
      errors: [
        {
          email: "—",
          message:
            parsed.error.issues[0]?.message ?? "JSON de importação inválido.",
        },
      ],
    };
  }

  const mode = await detectImportMode(supabase);
  const hasPasswordColumn = await supportsDefaultPasswordColumn(supabase);
  const deduped = new Map<string, ImportClientRecord>();

  for (const record of parsed.data) {
    const email = record.email.trim().toLowerCase();
    deduped.set(email, record);
  }

  summary.total = deduped.size;

  for (const record of deduped.values()) {
    const normalized = normalizeImportRecord(record);

    if (!normalized) {
      summary.skipped += 1;
      summary.errors.push({
        email: record.email,
        message: "Email ou nome inválido após normalização.",
      });
      continue;
    }

    try {
      const existing = await getExistingClientByEmail(
        supabase,
        normalized.email,
        mode,
      );

      if (existing) {
        const payload =
          mode === "extended"
            ? buildExtendedUpdatePayload(
                existing,
                normalized,
                hasPasswordColumn,
              )
            : buildLegacyUpdatePayload(
                existing,
                normalized,
                hasPasswordColumn,
              );

        const { error } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", existing.id);

        if (error) {
          throw new Error(error.message);
        }

        summary.updated += 1;
        continue;
      }

      const payload =
        mode === "extended"
          ? buildExtendedInsertPayload(normalized, hasPasswordColumn)
          : buildLegacyInsertPayload(normalized, hasPasswordColumn);

      const { error } = await supabase
        .from("clients")
        .insert(payload as Record<string, unknown>);

      if (error) {
        throw new Error(error.message);
      }

      summary.created += 1;
    } catch (error) {
      summary.errors.push({
        email: normalized.email,
        message:
          error instanceof Error ? error.message : "Erro ao importar cliente.",
      });
    }
  }

  summary.success = summary.errors.length === 0;
  return summary;
}

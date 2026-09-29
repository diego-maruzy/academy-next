import type { SupabaseClient } from "@supabase/supabase-js";
import {
  normalizeClientPlan,
  type ClientPlan,
} from "@/lib/clients/client-access";
import {
  normalizeEmail,
  normalizeImportRecord,
  resolveClientImportPlan,
  resolveHasAccessed,
  resolveLastSignInAt,
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

type ExistingProfileRow = {
  id: string;
  email: string;
  last_login_at: string | null;
  created_at: string;
};

type ExistingClientAccessRow = {
  id: string;
  user_id: string;
  plan: ClientPlan | string | null;
  status: string | null;
  source_role: string | null;
};

function splitName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);

  return {
    first_name: parts[0] ?? null,
    last_name: parts.length > 1 ? parts.slice(1).join(" ") : null,
  };
}

function buildProfilePayload(record: NormalizedClientImport) {
  return {
    display_name: record.full_name,
    email: record.email,
    country: record.country,
    state: record.state,
    city: record.city,
    whatsapp: record.phone,
    auth_provider: "import:json",
    status: "active",
    last_login_at: record.last_sign_in_at,
    created_at: record.created_at,
    updated_at: new Date().toISOString(),
    ...splitName(record.full_name),
  };
}

function getRecordEmail(record: { email?: string | null }) {
  return normalizeEmail(record.email ?? "");
}

async function getExistingProfileByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<ExistingProfileRow | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, last_login_at, created_at")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ExistingProfileRow | null) ?? null;
}

async function getExistingClientAccess(
  supabase: SupabaseClient,
  userId: string,
): Promise<ExistingClientAccessRow | null> {
  const { data, error } = await supabase
    .from("client_access")
    .select("id, user_id, plan, status, source_role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return (data as ExistingClientAccessRow | null) ?? null;
}

async function upsertImportedClientAccess(
  supabase: SupabaseClient,
  userId: string,
  incomingPlan: ClientPlan,
) {
  const existing = await getExistingClientAccess(supabase, userId);

  const resolvedPlan = existing
    ? resolveClientImportPlan(existing.plan, incomingPlan)
    : normalizeClientPlan(incomingPlan);

  const now = new Date().toISOString();

  const { error } = await supabase.from("client_access").upsert(
    {
      user_id: userId,
      plan: resolvedPlan,
      status: existing?.status || "active",
      source_role: "import_json",
      updated_at: now,
    },
    {
      onConflict: "user_id",
    },
  );

  if (error) {
    throw new Error(error.message);
  }
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

  const deduped = new Map<string, ImportClientRecord>();

  for (const record of parsed.data) {
    const email = getRecordEmail(record);

    if (!email) {
      summary.skipped += 1;
      summary.errors.push({
        email: "—",
        message: "Registro sem email.",
      });
      continue;
    }

    deduped.set(email, record as ImportClientRecord);
  }

  summary.total = deduped.size;

  for (const record of deduped.values()) {
    const normalized = normalizeImportRecord(record);

    if (!normalized) {
      summary.skipped += 1;
      summary.errors.push({
        email: getRecordEmail(record) || "—",
        message: "Email ou nome inválido após normalização.",
      });
      continue;
    }

    try {
      const existing = await getExistingProfileByEmail(
        supabase,
        normalized.email,
      );

      const plan = normalizeClientPlan(normalized.plan);

      if (existing) {
        const payload = buildProfilePayload({
          ...normalized,
          has_accessed: resolveHasAccessed(true, normalized.has_accessed),
          last_sign_in_at: resolveLastSignInAt(
            existing.last_login_at,
            normalized.last_sign_in_at,
          ),
        });

        const { error } = await supabase
          .from("profiles")
          .update(payload)
          .eq("id", existing.id);

        if (error) {
          throw new Error(error.message);
        }

        await upsertImportedClientAccess(supabase, existing.id, plan);

        summary.updated += 1;
        continue;
      }

      const { data: createdProfile, error } = await supabase
        .from("profiles")
        .insert(buildProfilePayload(normalized))
        .select("id")
        .single();

      if (error || !createdProfile) {
        throw new Error(error?.message ?? "Erro ao criar profile.");
      }

      await upsertImportedClientAccess(
        supabase,
        createdProfile.id as string,
        plan,
      );

      summary.created += 1;
    } catch (error) {
      summary.errors.push({
        email: normalized.email,
        message:
          error instanceof Error ? error.message : "Erro ao importar profile.",
      });
    }
  }

  summary.success = summary.errors.length === 0;

  return summary;
}
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  createSupabaseServiceServerClient,
  formatSupabaseError,
} from "@/lib/supabase/server";
import { getClientRoleLabel } from "@/lib/oidc/roles";
import type { AcademyAppRole } from "@/lib/auth/keycloak-roles";

export type EnsureSupabaseAuthUserInput = {
  sub: string;
  email: string;
  name: string;
  roles: string[];
  appRole: AcademyAppRole | string;
};

export type EnsureSupabaseAuthUserSuccess = {
  ok: true;
  authUserId: string;
  email: string;
  authUserCreated: boolean;
  clientId?: string;
  clientCreated: boolean;
};

export type EnsureSupabaseAuthUserFailure = {
  ok: false;
  step: "create_auth_user" | "update_auth_user" | "upsert_client";
  code: string;
  supabaseErrorCode?: string;
  supabaseErrorMessage?: string;
};

export type EnsureSupabaseAuthUserResult =
  | EnsureSupabaseAuthUserSuccess
  | EnsureSupabaseAuthUserFailure;

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function buildUserMetadata(input: EnsureSupabaseAuthUserInput) {
  return {
    provider: "keycloak",
    keycloak_id: input.sub,
    roles: input.roles,
    appRole: input.appRole,
    full_name: input.name,
    display_name: input.name,
  };
}

async function findAuthUserByEmail(
  supabase: SupabaseClient,
  email: string,
): Promise<User | null> {
  let page = 1;

  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({
      page,
      perPage: 200,
    });

    if (error || !data?.users?.length) {
      return null;
    }

    const found = data.users.find(
      (user) => user.email?.toLowerCase() === email.toLowerCase(),
    );

    if (found) {
      return found;
    }

    if (data.users.length < 200) {
      return null;
    }

    page += 1;
  }

  return null;
}

function isDuplicateAuthUserError(message: string) {
  const normalized = message.toLowerCase();

  return (
    normalized.includes("already been registered") ||
    normalized.includes("already exists") ||
    normalized.includes("duplicate") ||
    normalized.includes("user already registered")
  );
}

async function upsertClientRecord(
  supabase: SupabaseClient,
  input: EnsureSupabaseAuthUserInput,
): Promise<
  | { ok: true; clientId?: string; created: boolean }
  | EnsureSupabaseAuthUserFailure
> {
  const email = input.email.trim().toLowerCase();
  const clientRole = getClientRoleLabel(input.roles);
  const now = new Date().toISOString();

  const { data: existingByEmail, error: emailLookupError } = await supabase
    .from("clients")
    .select("id, email, keycloak_id")
    .eq("email", email)
    .maybeSingle();

  if (emailLookupError) {
    const formatted = formatSupabaseError(emailLookupError);

    return {
      ok: false,
      step: "upsert_client",
      code: "client_lookup_failed",
      supabaseErrorCode: formatted.code,
      supabaseErrorMessage: formatted.message,
    };
  }

  const clientPayload = {
    keycloak_id: input.sub,
    full_name: input.name,
    email,
    role: clientRole,
    status: "active",
    source: "keycloak",
    updated_at: now,
  };

  if (existingByEmail?.id) {
    const { error: updateError } = await supabase
      .from("clients")
      .update(clientPayload)
      .eq("id", existingByEmail.id);

    if (updateError) {
      const formatted = formatSupabaseError(updateError);

      return {
        ok: false,
        step: "upsert_client",
        code: "client_update_failed",
        supabaseErrorCode: formatted.code,
        supabaseErrorMessage: formatted.message,
      };
    }

    return {
      ok: true,
      clientId: existingByEmail.id,
      created: false,
    };
  }

  const { data: created, error: createError } = await supabase
    .from("clients")
    .insert({
      ...clientPayload,
      created_at: now,
    })
    .select("id")
    .single();

  if (createError) {
    const formatted = formatSupabaseError(createError);

    return {
      ok: false,
      step: "upsert_client",
      code: "client_create_failed",
      supabaseErrorCode: formatted.code,
      supabaseErrorMessage: formatted.message,
    };
  }

  return {
    ok: true,
    clientId: created.id,
    created: true,
  };
}

export async function ensureSupabaseAuthUserFromOidc(
  input: EnsureSupabaseAuthUserInput,
): Promise<EnsureSupabaseAuthUserResult> {
  const email = input.email.trim().toLowerCase();
  const sub = input.sub.trim();
  const name = input.name.trim() || email;

  if (!email || !sub) {
    return {
      ok: false,
      step: "create_auth_user",
      code: "missing_identity",
      supabaseErrorMessage: "Email e sub são obrigatórios.",
    };
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return {
      ok: false,
      step: "create_auth_user",
      code: "missing_supabase_service_role",
      supabaseErrorMessage: "SUPABASE_SERVICE_ROLE_KEY ausente ou inválida.",
    };
  }

  const metadata = buildUserMetadata({ ...input, email, name, sub });
  let authUser: User | null = null;
  let authUserCreated = false;

  const createPayload: {
    email: string;
    email_confirm: boolean;
    user_metadata: Record<string, unknown>;
    id?: string;
  } = {
    email,
    email_confirm: true,
    user_metadata: metadata,
  };

  if (isUuid(sub)) {
    createPayload.id = sub;
  }

  const { data: createdUser, error: createError } =
    await supabase.auth.admin.createUser(createPayload);

  if (createError) {
    if (!isDuplicateAuthUserError(createError.message)) {
      const formatted = formatSupabaseError(createError);

      return {
        ok: false,
        step: "create_auth_user",
        code: "create_auth_user_failed",
        supabaseErrorCode: formatted.code ?? createError.name,
        supabaseErrorMessage: formatted.message,
      };
    }

    authUser = await findAuthUserByEmail(supabase, email);

    if (!authUser) {
      return {
        ok: false,
        step: "create_auth_user",
        code: "auth_user_not_found_after_duplicate",
        supabaseErrorMessage: createError.message,
      };
    }
  } else {
    authUser = createdUser.user;
    authUserCreated = true;
  }

  if (!authUser) {
    return {
      ok: false,
      step: "create_auth_user",
      code: "auth_user_missing",
      supabaseErrorMessage: "Usuário Supabase Auth não pôde ser resolvido.",
    };
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(
    authUser.id,
    {
      email,
      email_confirm: true,
      user_metadata: {
        ...(authUser.user_metadata ?? {}),
        ...metadata,
      },
    },
  );

  if (updateError) {
    const formatted = formatSupabaseError(updateError);

    return {
      ok: false,
      step: "update_auth_user",
      code: "update_auth_user_failed",
      supabaseErrorCode: formatted.code ?? updateError.name,
      supabaseErrorMessage: formatted.message,
    };
  }

  const clientResult = await upsertClientRecord(supabase, {
    ...input,
    email,
    name,
    sub,
  });

  if (!clientResult.ok) {
    return clientResult;
  }

  return {
    ok: true,
    authUserId: authUser.id,
    email,
    authUserCreated,
    clientId: clientResult.clientId,
    clientCreated: clientResult.created,
  };
}

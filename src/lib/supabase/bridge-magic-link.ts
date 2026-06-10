import {
  createSupabaseServiceServerClient,
  formatSupabaseError,
} from "@/lib/supabase/server";
import {
  ensureSupabaseAuthUserFromOidc,
  type EnsureSupabaseAuthUserInput,
} from "@/lib/supabase/ensure-auth-user";
import { getSupabaseEnvStatus } from "@/lib/supabase/env-status";

export type GenerateBridgeMagicLinkSuccess = {
  ok: true;
  token_hash: string;
  authUserEnsured: true;
  authUserId: string;
};

export type GenerateBridgeMagicLinkFailure = {
  ok: false;
  code: "supabase_bridge_failed" | "missing_supabase_service_role";
  step: "create_auth_user" | "update_auth_user" | "upsert_client" | "generate_link" | "missing_hashed_token";
  hasServiceRoleKey: boolean;
  hasSupabaseUrl: boolean;
  emailPresent: boolean;
  subPresent: boolean;
  supabaseErrorCode?: string;
  supabaseErrorMessage?: string;
};

export type GenerateBridgeMagicLinkResult =
  | GenerateBridgeMagicLinkSuccess
  | GenerateBridgeMagicLinkFailure;

function buildBridgeFailure(
  partial: Omit<GenerateBridgeMagicLinkFailure, "hasServiceRoleKey" | "hasSupabaseUrl" | "emailPresent" | "subPresent"> & {
    emailPresent?: boolean;
    subPresent?: boolean;
  },
): GenerateBridgeMagicLinkFailure {
  const env = getSupabaseEnvStatus();

  return {
    hasServiceRoleKey: env.hasServiceRoleKey,
    hasSupabaseUrl: env.hasSupabaseUrl,
    emailPresent: partial.emailPresent ?? false,
    subPresent: partial.subPresent ?? false,
    ...partial,
  };
}

export async function generateSupabaseBridgeMagicLink(
  input: EnsureSupabaseAuthUserInput & { redirectTo?: string },
): Promise<GenerateBridgeMagicLinkResult> {
  const email = input.email?.trim().toLowerCase();
  const sub = input.sub?.trim();
  const env = getSupabaseEnvStatus();

  if (!env.hasServiceRoleKey) {
    return buildBridgeFailure({
      ok: false,
      code: "missing_supabase_service_role",
      step: "create_auth_user",
      emailPresent: Boolean(email),
      subPresent: Boolean(sub),
      supabaseErrorMessage: "SUPABASE_SERVICE_ROLE_KEY ausente ou inválida.",
    });
  }

  const ensured = await ensureSupabaseAuthUserFromOidc({
    sub: sub ?? "",
    email: email ?? "",
    name: input.name,
    roles: input.roles,
    appRole: input.appRole,
  });

  if (!ensured.ok) {
    return buildBridgeFailure({
      ok: false,
      code: "supabase_bridge_failed",
      step: ensured.step,
      emailPresent: Boolean(email),
      subPresent: Boolean(sub),
      supabaseErrorCode: ensured.supabaseErrorCode,
      supabaseErrorMessage: ensured.supabaseErrorMessage,
    });
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return buildBridgeFailure({
      ok: false,
      code: "missing_supabase_service_role",
      step: "generate_link",
      emailPresent: Boolean(email),
      subPresent: Boolean(sub),
      supabaseErrorMessage: "Cliente Supabase service indisponível.",
    });
  }

  const { data, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: ensured.email,
    options: {
      redirectTo: input.redirectTo,
    },
  });

  if (error) {
    const formatted = formatSupabaseError(error);

    return buildBridgeFailure({
      ok: false,
      code: "supabase_bridge_failed",
      step: "generate_link",
      emailPresent: true,
      subPresent: Boolean(sub),
      supabaseErrorCode: formatted.code ?? error.name,
      supabaseErrorMessage: formatted.message,
    });
  }

  const tokenHash = data?.properties?.hashed_token;

  if (!tokenHash) {
    return buildBridgeFailure({
      ok: false,
      code: "supabase_bridge_failed",
      step: "missing_hashed_token",
      emailPresent: true,
      subPresent: Boolean(sub),
      supabaseErrorMessage: "generateLink não retornou hashed_token.",
    });
  }

  return {
    ok: true,
    token_hash: tokenHash,
    authUserEnsured: true,
    authUserId: ensured.authUserId,
  };
}

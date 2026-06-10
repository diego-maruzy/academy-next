import { NextResponse, type NextRequest } from "next/server";
import { mapOidcRolesToAppRole } from "@/lib/oidc/roles";
import { ensureSupabaseAuthUserFromOidc } from "@/lib/supabase/ensure-auth-user";
import { getSupabaseEnvStatus } from "@/lib/supabase/env-status";

export const dynamic = "force-dynamic";

type ProvisionBody = {
  sub?: string;
  email?: string;
  name?: string;
  roles?: string[];
  appRole?: string;
};

export async function POST(request: NextRequest) {
  let body: ProvisionBody;

  try {
    body = (await request.json()) as ProvisionBody;
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_body" },
      { status: 400 },
    );
  }

  const email = body.email?.trim().toLowerCase();
  const sub = body.sub?.trim();
  const name = body.name?.trim() || email;
  const roles = Array.isArray(body.roles) ? body.roles : [];
  const appRole = body.appRole ?? mapOidcRolesToAppRole(roles);
  const env = getSupabaseEnvStatus();

  console.info("[OIDC API]", {
    route: "/api/oidc/provision",
    step: "start",
    hasSupabaseUrl: env.hasSupabaseUrl,
    hasAnonKey: env.hasAnonKey,
    hasServiceRole: env.hasServiceRoleKey,
    emailPresent: Boolean(email),
    subPresent: Boolean(sub),
  });

  if (!email || !sub) {
    console.error("[OIDC API]", {
      route: "/api/oidc/provision",
      step: "validate_identity",
      code: "missing_identity",
      message: "Email e sub são obrigatórios.",
    });

    return NextResponse.json(
      {
        ok: false,
        error: "missing_identity",
        message: "Email e sub são obrigatórios.",
      },
      { status: 400 },
    );
  }

  if (!env.hasServiceRoleKey) {
    console.error("[OIDC API]", {
      route: "/api/oidc/provision",
      step: "env_check",
      code: "missing_supabase_service_role",
      message: "SUPABASE_SERVICE_ROLE_KEY ausente.",
    });

    return NextResponse.json(
      {
        ok: false,
        error: "missing_supabase_service_role",
        hasServiceRoleKey: false,
        hasSupabaseUrl: env.hasSupabaseUrl,
      },
      { status: 503 },
    );
  }

  try {
    const result = await ensureSupabaseAuthUserFromOidc({
      sub,
      email,
      name: name ?? email,
      roles,
      appRole,
    });

    if (!result.ok) {
      console.error("[OIDC API]", {
        route: "/api/oidc/provision",
        step: result.step ?? "provision",
        code: result.code ?? "provision_failed",
        message: result.supabaseErrorMessage,
        status: 500,
      });

      return NextResponse.json(
        {
          ok: false,
          error: "provision_failed",
          step: result.step,
          code: result.code,
          supabaseErrorCode: result.supabaseErrorCode,
          supabaseErrorMessage: result.supabaseErrorMessage,
        },
        { status: 500 },
      );
    }

    console.info("[OIDC API]", {
      route: "/api/oidc/provision",
      step: "success",
      authUserCreated: result.authUserCreated,
      clientCreated: result.clientCreated,
    });

    return NextResponse.json({
      ok: true,
      authUserId: result.authUserId,
      clientId: result.clientId,
      authUserCreated: result.authUserCreated,
      clientCreated: result.clientCreated,
      appRole,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";

    console.error("[OIDC API]", {
      route: "/api/oidc/provision",
      step: "exception",
      code: "provision_failed",
      message,
      status: 500,
    });

    return NextResponse.json(
      {
        ok: false,
        error: "provision_failed",
        message,
      },
      { status: 500 },
    );
  }
}

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

  if (!email || !sub) {
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

  const result = await ensureSupabaseAuthUserFromOidc({
    sub,
    email,
    name: name ?? email,
    roles,
    appRole,
  });

  if (!result.ok) {
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

  return NextResponse.json({
    ok: true,
    authUserId: result.authUserId,
    clientId: result.clientId,
    authUserCreated: result.authUserCreated,
    clientCreated: result.clientCreated,
    appRole,
  });
}

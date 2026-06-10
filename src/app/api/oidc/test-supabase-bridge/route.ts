import { NextResponse, type NextRequest } from "next/server";
import {
  getOidcTestIdentityFromEnv,
  isOidcHostTestEnabled,
} from "@/lib/auth/oidc-test-config";
import { mapOidcRolesToAppRole } from "@/lib/oidc/roles";
import { generateSupabaseBridgeMagicLink } from "@/lib/supabase/bridge-magic-link";
import { getSupabaseEnvStatus } from "@/lib/supabase/env-status";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isOidcHostTestEnabled()) {
    return NextResponse.json(
      { ok: false, code: "test_disabled" },
      { status: 404 },
    );
  }

  const env = getSupabaseEnvStatus();
  const identity = getOidcTestIdentityFromEnv();

  if (!identity.email || !identity.sub) {
    return NextResponse.json(
      {
        ok: false,
        code: "missing_test_identity",
        message: "Defina OIDC_TEST_EMAIL e OIDC_TEST_SUB no ambiente.",
        hasServiceRoleKey: env.hasServiceRoleKey,
        hasSupabaseUrl: env.hasSupabaseUrl,
        emailPresent: Boolean(identity.email),
        subPresent: Boolean(identity.sub),
      },
      { status: 400 },
    );
  }

  if (!env.hasServiceRoleKey) {
    return NextResponse.json(
      {
        ok: false,
        code: "missing_supabase_service_role",
        hasServiceRoleKey: false,
        hasSupabaseUrl: env.hasSupabaseUrl,
        emailPresent: true,
        subPresent: true,
      },
      { status: 503 },
    );
  }

  const result = await generateSupabaseBridgeMagicLink({
    sub: identity.sub,
    email: identity.email,
    name: identity.name,
    roles: identity.roles,
    appRole: mapOidcRolesToAppRole(identity.roles),
    redirectTo: `${request.nextUrl.origin}/dashboard`,
  });

  if (!result.ok) {
    return NextResponse.json(
      {
        ...result,
        authUserEnsured: false,
        magicLinkGenerated: false,
        hasHashedToken: false,
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    authUserEnsured: result.authUserEnsured,
    magicLinkGenerated: true,
    hasHashedToken: Boolean(result.token_hash),
    authUserId: result.authUserId,
  });
}

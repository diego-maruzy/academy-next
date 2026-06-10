import { NextResponse } from "next/server";
import { getSupabaseEnvStatus } from "@/lib/supabase/env-status";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabase = getSupabaseEnvStatus();

  const env = {
    hasSupabaseUrl: supabase.hasSupabaseUrl,
    hasSupabaseAnonKey: supabase.hasAnonKey,
    hasSupabaseServiceRole: supabase.hasServiceRoleKey,
    hasKeycloakIssuer: Boolean(
      process.env.KEYCLOAK_ISSUER ?? process.env.NEXT_PUBLIC_KEYCLOAK_ISSUER,
    ),
    hasKeycloakClientId: Boolean(
      process.env.KEYCLOAK_CLIENT_ID ??
        process.env.KEYCLOAK_PUBLIC_CLIENT_ID ??
        process.env.NEXT_PUBLIC_KEYCLOAK_CLIENT_ID,
    ),
    hasAuthSecret: Boolean(process.env.AUTH_SECRET),
  };

  if (!env.hasSupabaseServiceRole) {
    return NextResponse.json({
      ok: false,
      code: "missing_supabase_service_role",
      env,
    });
  }

  const ok = Object.values(env).every(Boolean);

  return NextResponse.json({
    ok,
    env,
    ...(ok ? {} : { code: "missing_env" }),
  });
}

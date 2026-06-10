import { NextResponse, type NextRequest } from "next/server";
import { mapOidcRolesToAppRole } from "@/lib/oidc/roles";
import { generateSupabaseBridgeMagicLink } from "@/lib/supabase/bridge-magic-link";
import { getSupabaseEnvStatus } from "@/lib/supabase/env-status";

export const dynamic = "force-dynamic";

type BridgeBody = {
  email?: string;
  sub?: string;
  name?: string;
  roles?: string[];
  appRole?: string;
};

export async function POST(request: NextRequest) {
  let body: BridgeBody;

  try {
    body = (await request.json()) as BridgeBody;
  } catch {
    return NextResponse.json(
      { ok: false, code: "invalid_body" },
      { status: 400 },
    );
  }

  const email = body.email?.trim().toLowerCase();
  const sub = body.sub?.trim();
  const roles = Array.isArray(body.roles) ? body.roles : [];
  const appRole = body.appRole ?? mapOidcRolesToAppRole(roles);
  const origin = request.nextUrl.origin;
  const env = getSupabaseEnvStatus();

  console.info("[OIDC API]", {
    route: "/api/oidc/supabase-bridge",
    step: "start",
    hasSupabaseUrl: env.hasSupabaseUrl,
    hasAnonKey: env.hasAnonKey,
    hasServiceRole: env.hasServiceRoleKey,
    emailPresent: Boolean(email),
    subPresent: Boolean(sub),
  });

  if (!email || !sub) {
    console.error("[OIDC API]", {
      route: "/api/oidc/supabase-bridge",
      step: "validate_identity",
      code: "missing_identity",
      message: "Email e sub são obrigatórios.",
      status: 400,
    });

    return NextResponse.json(
      { ok: false, code: "missing_identity" },
      { status: 400 },
    );
  }

  try {
    const result = await generateSupabaseBridgeMagicLink({
      sub,
      email,
      name: body.name?.trim() || email || "Checkmate User",
      roles,
      appRole,
      redirectTo: `${origin}/dashboard`,
    });

    if (!result.ok) {
      console.error("[OIDC API]", {
        route: "/api/oidc/supabase-bridge",
        step: result.step ?? "bridge",
        code: result.code,
        message: result.supabaseErrorMessage,
        status: result.code === "missing_supabase_service_role" ? 503 : 500,
      });

      return NextResponse.json(result, {
        status: result.code === "missing_supabase_service_role" ? 503 : 500,
      });
    }

    console.info("[OIDC API]", {
      route: "/api/oidc/supabase-bridge",
      step: "success",
      hasTokenHash: Boolean(result.token_hash),
    });

    return NextResponse.json({
      ok: true,
      token_hash: result.token_hash,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";

    console.error("[OIDC API]", {
      route: "/api/oidc/supabase-bridge",
      step: "exception",
      code: "supabase_bridge_failed",
      message,
      status: 500,
    });

    return NextResponse.json(
      {
        ok: false,
        code: "supabase_bridge_failed",
        message,
      },
      { status: 500 },
    );
  }
}

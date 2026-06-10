import { NextResponse, type NextRequest } from "next/server";
import { mapOidcRolesToAppRole } from "@/lib/oidc/roles";
import { generateSupabaseBridgeMagicLink } from "@/lib/supabase/bridge-magic-link";

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

  const result = await generateSupabaseBridgeMagicLink({
    sub: sub ?? "",
    email: email ?? "",
    name: body.name?.trim() || email || "Checkmate User",
    roles,
    appRole,
    redirectTo: `${origin}/dashboard`,
  });

  if (!result.ok) {
    return NextResponse.json(result, {
      status: result.code === "missing_supabase_service_role" ? 503 : 500,
    });
  }

  return NextResponse.json({
    ok: true,
    token_hash: result.token_hash,
  });
}

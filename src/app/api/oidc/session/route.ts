import { NextResponse, type NextRequest } from "next/server";
import { auth, signIn } from "@/auth";
import { logOidcStart } from "@/lib/auth/oidc-debug-log";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

export const dynamic = "force-dynamic";

type SessionBody = {
  id_token?: string;
  access_token?: string;
  next?: string;
  callbackUrl?: string;
};

export async function POST(request: NextRequest) {
  const userAgent = request.headers.get("user-agent") ?? "";
  let body: SessionBody;

  try {
    body = (await request.json()) as SessionBody;
  } catch {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const idToken = body.id_token;
  const accessToken = body.access_token;
  const destination = resolveStudentCallbackUrl(
    body.next ?? body.callbackUrl,
  );

  if (!idToken || typeof idToken !== "string") {
    return NextResponse.json({ error: "missing_token" }, { status: 400 });
  }

  try {
    await signIn("keycloak-token", {
      id_token: idToken,
      access_token: typeof accessToken === "string" ? accessToken : "",
      redirect: false,
      redirectTo: destination,
    });

    const session = await auth();

    if (!session?.user) {
      logOidcStart({
        userAgent,
        hasSession: false,
        destination,
        redirected: false,
      });

      return NextResponse.json({ error: "invalid_token" }, { status: 401 });
    }

    logOidcStart({
      userAgent,
      hasSession: true,
      destination,
      redirected: true,
    });

    return NextResponse.json({
      ok: true,
      redirect: destination,
    });
  } catch {
    logOidcStart({
      userAgent,
      hasSession: false,
      destination,
      redirected: false,
    });

    return NextResponse.json({ error: "session_failed" }, { status: 401 });
  }
}

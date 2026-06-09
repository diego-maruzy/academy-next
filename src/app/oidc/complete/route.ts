import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/auth";
import {
  buildCompleteSuccessHtml,
  buildSessionMissingHtml,
} from "@/lib/auth/oidc-login-html";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

export const dynamic = "force-dynamic";

function htmlResponse(html: string, status = 200) {
  return new NextResponse(html, {
    status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function GET(request: NextRequest) {
  const session = await auth();
  const destination = resolveStudentCallbackUrl(
    request.nextUrl.searchParams.get("next") ??
      request.nextUrl.searchParams.get("callbackUrl"),
  );

  if (!session?.user) {
    return htmlResponse(buildSessionMissingHtml(), 401);
  }

  const targetUrl = new URL(destination, request.url).toString();

  return htmlResponse(buildCompleteSuccessHtml(targetUrl));
}

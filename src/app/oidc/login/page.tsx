import { Suspense } from "react";
import { headers } from "next/headers";
import { OidcLoginFlow } from "@/components/auth/oidc-login-flow";
import { OidcConnectingScreen } from "@/components/auth/oidc-connecting-screen";
import { getEmbeddedContextFromSearchParams } from "@/lib/embedded-params";
import { logOidcLoginAccess } from "@/lib/auth/oidc-debug-log";
import { getStudentCallbackUrlFromSearchParams } from "@/lib/auth/route-guard";
import {
  buildSafeTokenLog,
  normalizeTokenFromQuery,
} from "@/lib/auth/token-inspect";

type OidcLoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    next?: string;
    embedded?: string;
    returnUrl?: string;
    access_token?: string;
    id_token?: string;
    refresh_token?: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login | Checkmate Academy",
  robots: "noindex",
};

function OidcLoginFallback() {
  return (
    <OidcConnectingScreen
      title="Conectando sua conta Checkmate..."
      description="Aguarde um instante enquanto validamos seu acesso."
    />
  );
}

export default async function OidcLoginPage({ searchParams }: OidcLoginPageProps) {
  const params = await searchParams;
  const query = new URLSearchParams();

  if (params.callbackUrl) {
    query.set("callbackUrl", params.callbackUrl);
  }

  if (params.next) {
    query.set("next", params.next);
  }

  if (params.embedded) {
    query.set("embedded", params.embedded);
  }

  if (params.returnUrl) {
    query.set("returnUrl", params.returnUrl);
  }

  const destination = getStudentCallbackUrlFromSearchParams(query);
  const embedded = getEmbeddedContextFromSearchParams(query);
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";

  const tokenPresence = buildSafeTokenLog({
    accessToken: normalizeTokenFromQuery(params.access_token),
    idToken: normalizeTokenFromQuery(params.id_token),
    refreshToken: normalizeTokenFromQuery(params.refresh_token),
  });

  logOidcLoginAccess({
    userAgent,
    hasSession: false,
    destination,
    pathname: "/oidc/login",
    embedded,
    tokenPresence,
  });

  return (
    <Suspense fallback={<OidcLoginFallback />}>
      <OidcLoginFlow userAgent={userAgent} />
    </Suspense>
  );
}

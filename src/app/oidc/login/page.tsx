import { Suspense } from "react";
import { headers } from "next/headers";
import { OidcLoginFlow } from "@/components/auth/oidc-login-flow";
import { OidcConnectingScreen } from "@/components/auth/oidc-connecting-screen";
import { logOidcLoginAccess } from "@/lib/auth/oidc-debug-log";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";
import {
  buildSafeTokenLog,
  normalizeTokenFromQuery,
} from "@/lib/auth/token-inspect";

type OidcLoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    next?: string;
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
  const destination = resolveStudentCallbackUrl(
    params.callbackUrl ?? params.next,
  );
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
    tokenPresence,
  });

  return (
    <Suspense fallback={<OidcLoginFallback />}>
      <OidcLoginFlow userAgent={userAgent} />
    </Suspense>
  );
}

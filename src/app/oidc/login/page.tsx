import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { OidcLoginFallback } from "@/components/auth/oidc-login-fallback";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

type OidcLoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; next?: string; fallback?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login | Checkmate Academy",
  robots: "noindex",
};

export default async function OidcLoginPage({ searchParams }: OidcLoginPageProps) {
  const session = await auth();
  const { callbackUrl, next, fallback } = await searchParams;
  const redirectTo = resolveStudentCallbackUrl(callbackUrl ?? next);

  if (session?.user) {
    redirect(redirectTo);
  }

  if (fallback === "1") {
    return <OidcLoginFallback redirectTo={redirectTo} />;
  }

  try {
    const keycloakUrl = await signIn("keycloak", {
      redirectTo,
      redirect: false,
    });

    if (typeof keycloakUrl === "string" && keycloakUrl.length > 0) {
      redirect(keycloakUrl);
    }
  } catch {
    return <OidcLoginFallback redirectTo={redirectTo} />;
  }

  return <OidcLoginFallback redirectTo={redirectTo} />;
}

import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { OidcLoginFallback } from "@/components/auth/oidc-login-fallback";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";
import { AuthError } from "next-auth";

type OidcLoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; next?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login | Checkmate Academy",
  robots: "noindex",
};

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    typeof (error as { digest?: string }).digest === "string" &&
    (error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
  );
}

export default async function OidcLoginPage({ searchParams }: OidcLoginPageProps) {
  const session = await auth();
  const { callbackUrl, next } = await searchParams;
  const redirectTo = resolveStudentCallbackUrl(callbackUrl ?? next);

  if (session?.user) {
    redirect(redirectTo);
  }

  try {
    await signIn("keycloak", { redirectTo });
  } catch (error) {
    if (isNextRedirect(error)) {
      throw error;
    }

    if (error instanceof AuthError) {
      return <OidcLoginFallback redirectTo={redirectTo} />;
    }

    throw error;
  }
}

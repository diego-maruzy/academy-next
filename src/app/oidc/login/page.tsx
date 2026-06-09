import { headers } from "next/headers";
import { MobileOidcLogin } from "@/components/auth/mobile-oidc-login";
import { auth } from "@/auth";
import { logOidcLoginAccess } from "@/lib/auth/oidc-debug-log";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

type OidcLoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    next?: string;
    error?: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login | Checkmate Academy",
  robots: "noindex",
};

export default async function OidcLoginPage({ searchParams }: OidcLoginPageProps) {
  const session = await auth();
  const params = await searchParams;
  const destination = resolveStudentCallbackUrl(
    params.callbackUrl ?? params.next,
  );
  const headersList = await headers();
  const userAgent = headersList.get("user-agent") ?? "";

  logOidcLoginAccess({
    userAgent,
    hasSession: Boolean(session?.user),
    destination,
  });

  return (
    <MobileOidcLogin
      destination={destination}
      userAgent={userAgent}
      alreadyAuthenticated={Boolean(session?.user)}
      startError={params.error === "start"}
    />
  );
}

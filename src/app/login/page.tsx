import { redirect } from "next/navigation";
import { copyEmbeddedSearchParams } from "@/lib/embedded-params";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

type LoginPageProps = {
  searchParams: Promise<{
    callbackUrl?: string;
    embedded?: string;
    returnUrl?: string;
  }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login | Checkmate Academy",
  robots: "noindex",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const destination = resolveStudentCallbackUrl(params.callbackUrl);
  const loginUrl = new URL("/oidc/login", "http://local");
  loginUrl.searchParams.set("next", destination);
  copyEmbeddedSearchParams(
    new URLSearchParams({
      ...(params.embedded === "1" ? { embedded: "1" } : {}),
      ...(params.returnUrl ? { returnUrl: params.returnUrl } : {}),
    }),
    loginUrl.searchParams,
  );

  redirect(`${loginUrl.pathname}${loginUrl.search}`);
}

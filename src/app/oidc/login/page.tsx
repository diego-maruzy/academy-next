import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

type OidcLoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; next?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login | Checkmate Academy",
  robots: "noindex",
};

export default async function OidcLoginPage({ searchParams }: OidcLoginPageProps) {
  const session = await auth();
  const { callbackUrl, next } = await searchParams;
  const redirectTo = resolveStudentCallbackUrl(callbackUrl ?? next);

  if (session?.user) {
    redirect(redirectTo);
  }

  await signIn("keycloak", { redirectTo });
}

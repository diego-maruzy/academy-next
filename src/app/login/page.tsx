import { redirect } from "next/navigation";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

type LoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login | Checkmate Academy",
  robots: "noindex",
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;
  const destination = resolveStudentCallbackUrl(callbackUrl);
  const params = new URLSearchParams({ next: destination });

  redirect(`/oidc/login?${params.toString()}`);
}

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { KeycloakAutoLogin } from "@/components/auth/keycloak-auto-login";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

type StudentLoginEntryProps = {
  callbackUrl?: string | null;
};

export async function StudentLoginEntry({ callbackUrl }: StudentLoginEntryProps) {
  const session = await auth();
  const redirectTo = resolveStudentCallbackUrl(callbackUrl);

  if (session?.user) {
    redirect(redirectTo);
  }

  return <KeycloakAutoLogin callbackUrl={redirectTo} />;
}

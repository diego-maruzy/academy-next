import { OidcSilentCallback } from "@/components/auth/oidc-silent-callback";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login | Checkmate Academy",
  robots: "noindex",
};

export default function AuthSilentCallbackPage() {
  return <OidcSilentCallback />;
}

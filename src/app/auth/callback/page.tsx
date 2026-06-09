import { OidcCallbackFlow } from "@/components/auth/oidc-callback-flow";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login | Checkmate Academy",
  robots: "noindex",
};

export default function AuthCallbackPage() {
  return <OidcCallbackFlow />;
}

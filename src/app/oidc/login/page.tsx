import { StudentLoginEntry } from "@/components/auth/student-login-entry";

type OidcLoginPageProps = {
  searchParams: Promise<{ callbackUrl?: string; next?: string }>;
};

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Login | Checkmate Academy",
  robots: "noindex",
};

export default async function OidcLoginPage({ searchParams }: OidcLoginPageProps) {
  const { callbackUrl, next } = await searchParams;

  return <StudentLoginEntry callbackUrl={callbackUrl ?? next} />;
}

import { StudentLoginEntry } from "@/components/auth/student-login-entry";

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

  return <StudentLoginEntry callbackUrl={callbackUrl} />;
}

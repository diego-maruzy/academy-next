import { redirect } from "next/navigation";

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string }>;
};

export default async function AdminLoginPage({
  searchParams,
}: AdminLoginPageProps) {
  const { next } = await searchParams;
  const loginUrl = next ? `/login?callbackUrl=${encodeURIComponent(next)}` : "/login";
  redirect(loginUrl);
}

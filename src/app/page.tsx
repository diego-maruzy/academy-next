import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getDefaultAdminPath } from "@/lib/admin-auth/permissions";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { getStudentPostLoginPath } from "@/lib/auth/route-guard";

export default async function HomePage() {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect(getDefaultAdminPath());
  }

  const session = await auth();

  if (session?.user) {
    redirect(getStudentPostLoginPath());
  }

  redirect("/login");
}

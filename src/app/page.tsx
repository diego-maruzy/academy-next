import { redirect } from "next/navigation";
import { getDefaultAdminPath } from "@/lib/admin-auth/permissions";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { getStudentPostLoginPath } from "@/lib/auth/route-guard";
import { getSupabaseCurrentUser } from "@/lib/supabase/auth";

export default async function HomePage() {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect(getDefaultAdminPath());
  }

  const user = await getSupabaseCurrentUser();

  if (user) {
    redirect(getStudentPostLoginPath());
  }

  redirect("/login");
}

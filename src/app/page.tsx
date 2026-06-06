import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { getDefaultAdminPath } from "@/lib/admin-auth/permissions";

export default async function HomePage() {
  const admin = await getCurrentAdmin();

  if (admin) {
    redirect(getDefaultAdminPath());
  }

  redirect("/admin/login");
}

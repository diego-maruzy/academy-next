import { redirect } from "next/navigation";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { isAdmin, isTeam } from "@/lib/admin-auth/permissions";

export async function requireAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin || !isAdmin(admin)) {
    redirect("/admin/login");
  }

  return admin;
}

export async function requireTeamOrAdmin() {
  const admin = await getCurrentAdmin();

  if (!admin || (!isAdmin(admin) && !isTeam(admin))) {
    redirect("/admin/login");
  }

  return admin;
}

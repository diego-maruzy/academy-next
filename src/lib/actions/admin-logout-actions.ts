"use server";

import { redirect } from "next/navigation";
import { destroyAdminSession } from "@/lib/admin-auth/session";

export async function logoutAdminAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

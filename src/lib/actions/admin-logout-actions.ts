"use server";

import { signOut } from "@/auth";
import { destroyAdminSession } from "@/lib/admin-auth/session";

export async function logoutAdminAction() {
  await destroyAdminSession();
  await signOut({ redirectTo: "/login" });
}

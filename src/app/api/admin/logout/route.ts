import { NextResponse } from "next/server";
import { destroyAdminSession } from "@/lib/admin-auth/admin-session";

export async function POST() {
  await destroyAdminSession();

  return NextResponse.json({
    success: true,
    redirectTo: "/admin/login",
  });
}

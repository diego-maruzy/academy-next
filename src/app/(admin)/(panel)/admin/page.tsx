import { redirect } from "next/navigation";
import { getDefaultAdminPath } from "@/lib/admin-auth/permissions";

export default function AdminIndexPage() {
  redirect(getDefaultAdminPath());
}

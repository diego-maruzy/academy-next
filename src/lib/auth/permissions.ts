import type { UserRole } from "@/lib/auth/roles";

export function getDefaultPathForRole(role: UserRole): string {
  if (role === "client") {
    return "/dashboard";
  }

  if (role === "team") {
    return "/admin";
  }

  return "/admin";
}

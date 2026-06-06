import type { UserRole } from "@/lib/auth/roles";

export function getDefaultPathForRole(role: UserRole): string {
  if (role === "client") {
    return "/programas";
  }

  if (role === "team") {
    return "/dashboard";
  }

  return "/dashboard";
}

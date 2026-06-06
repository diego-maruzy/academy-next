import {
  verifyAdminSession,
  type AdminSessionPayload,
} from "@/lib/admin-auth/session";

export type CurrentAdmin = AdminSessionPayload;

export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  return verifyAdminSession();
}

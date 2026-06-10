import Credentials from "next-auth/providers/credentials";
import { verifyHostSsoUserPayload } from "@/lib/auth/host-sso-payload";

export const hostSsoProvider = Credentials({
  id: "host-sso",
  name: "Host SSO",
  credentials: {
    payload: { label: "Signed payload", type: "text" },
  },
  authorize: async (credentials) => {
    const rawPayload = credentials?.payload;

    if (!rawPayload || typeof rawPayload !== "string") {
      return null;
    }

    const verified = verifyHostSsoUserPayload(rawPayload);

    if (!verified) {
      return null;
    }

    return {
      id: verified.sub,
      email: verified.email,
      name: verified.name,
      roles: verified.roles,
      ignoredRoles: verified.ignoredRoles,
      appRole: verified.appRole,
      rolesSource: verified.source,
      provider: verified.provider,
    };
  },
});

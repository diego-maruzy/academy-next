import { signIn } from "@/auth";
import {
  signHostSsoUserPayload,
  type HostSsoSessionInput,
} from "@/lib/auth/host-sso-payload";

export type CreateHostSsoSessionResult =
  | { ok: true }
  | { ok: false; error: "session_failed" | "sign_in_rejected"; detail?: string };

function isSignInFailure(result: unknown) {
  if (typeof result !== "string") {
    return false;
  }

  try {
    const url = new URL(result, "http://local");
    const error = url.searchParams.get("error");

    if (error) {
      return true;
    }
  } catch {
    // fall through to string checks
  }

  const lower = result.toLowerCase();

  return lower.includes("credentialssignin") || lower.includes("error=");
}

export async function createHostSsoSession(
  user: HostSsoSessionInput,
): Promise<CreateHostSsoSessionResult> {
  const signedPayload = signHostSsoUserPayload({
    sub: user.sub,
    email: user.email,
    name: user.name,
    roles: user.roles,
    ignoredRoles: user.ignoredRoles,
    appRole: user.appRole,
    provider: "oidc-host",
    source: "host-tokens",
  });

  try {
    const result = await signIn("host-sso", {
      payload: signedPayload,
      redirect: false,
      redirectTo: "/dashboard",
    });

    if (isSignInFailure(result)) {
      return {
        ok: false,
        error: "sign_in_rejected",
        detail: typeof result === "string" ? result : undefined,
      };
    }

    return { ok: true };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "unknown_error";

    return {
      ok: false,
      error: "session_failed",
      detail,
    };
  }
}

import { auth } from "@/auth";

let warnedAuthLookupFailure = false;

export async function safeAuth() {
  try {
    return await auth();
  } catch (error) {
    if (!warnedAuthLookupFailure) {
      warnedAuthLookupFailure = true;
      console.warn(
        "[auth] Sessão Auth.js indisponível; usando fallback OIDC/Supabase.",
        error instanceof Error ? error.message : error,
      );
    }

    return null;
  }
}

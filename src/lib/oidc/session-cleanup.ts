"use client";

import { getManager } from "@/lib/oidc/auth-service";
import { getOidcUserStorageKey } from "@/lib/oidc/config-service";
import { stripHostTokensFromUrl } from "@/lib/oidc/host-sso";

export async function clearInvalidOidcSession() {
  stripHostTokensFromUrl();

  try {
    await getManager().removeUser();
  } catch {
    // ignore — user may already be absent
  }

  if (typeof window === "undefined") {
    return;
  }

  const storageKey = getOidcUserStorageKey();
  localStorage.removeItem(storageKey);

  const keysToRemove: string[] = [];

  for (let index = 0; index < localStorage.length; index += 1) {
    const key = localStorage.key(index);

    if (key?.startsWith("oidc.")) {
      keysToRemove.push(key);
    }
  }

  for (const key of keysToRemove) {
    localStorage.removeItem(key);
  }
}

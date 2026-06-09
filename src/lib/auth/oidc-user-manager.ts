"use client";

import { UserManager } from "oidc-client-ts";
import { createOidcClientSettings } from "@/lib/auth/oidc-client-settings";

let manager: UserManager | null = null;

export function getOidcUserManager() {
  if (!manager) {
    manager = new UserManager(createOidcClientSettings());
  }

  return manager;
}

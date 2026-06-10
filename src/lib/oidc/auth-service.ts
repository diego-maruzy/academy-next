"use client";

import { User, UserManager } from "oidc-client-ts";
import { createOidcClientSettings } from "@/lib/oidc/config-service";

let manager: UserManager | null = null;

export function getManager() {
  if (!manager) {
    manager = new UserManager(createOidcClientSettings());
  }

  return manager;
}

/** @deprecated Use getManager() */
export function getOidcUserManager() {
  return getManager();
}

export async function getUser() {
  return getManager().getUser();
}

export async function hasValidOidcUser() {
  const user = await getUser();
  return Boolean(user && !user.expired);
}

export async function login(state?: string) {
  await getManager().signinRedirect({ state });
}

export async function loginWithPromptNone(state?: string) {
  await getManager().signinRedirect({
    state,
    extraQueryParams: { prompt: "none" },
  });
}

export async function handleCallback() {
  return getManager().signinRedirectCallback();
}

export async function trySilentSso() {
  try {
    return await getManager().signinSilent();
  } catch {
    return null;
  }
}

export async function handleSilentCallback() {
  return getManager().signinSilentCallback();
}

export async function refreshToken() {
  return getManager().signinSilent();
}

export async function logout() {
  await getManager().signoutRedirect();
}

export function isLoginRequiredError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const message =
    "message" in error && typeof error.message === "string"
      ? error.message.toLowerCase()
      : "";
  const errorCode =
    "error" in error && typeof error.error === "string"
      ? error.error.toLowerCase()
      : "";

  return (
    errorCode === "login_required" ||
    message.includes("login_required") ||
    message.includes("interaction_required")
  );
}

export async function storeOidcUser(user: User) {
  await getManager().storeUser(user);
}

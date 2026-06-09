"use client";

import {
  EMBEDDED_PARAM,
  RETURN_URL_PARAM,
  type EmbeddedContext,
  appendEmbeddedParamsToPath,
  getEmbeddedContextFromSearchParams,
} from "@/lib/embedded-params";

const EMBEDDED_STORAGE_KEY = "checkmate_embedded_context";

function readStoredContext(): EmbeddedContext {
  if (typeof window === "undefined") {
    return { embedded: false, returnUrl: null };
  }

  try {
    const raw = sessionStorage.getItem(EMBEDDED_STORAGE_KEY);

    if (!raw) {
      return { embedded: false, returnUrl: null };
    }

    const parsed = JSON.parse(raw) as Partial<EmbeddedContext>;

    return {
      embedded: parsed.embedded === true,
      returnUrl:
        typeof parsed.returnUrl === "string" && parsed.returnUrl.length > 0
          ? parsed.returnUrl
          : null,
    };
  } catch {
    return { embedded: false, returnUrl: null };
  }
}

export function getEmbeddedContext(): EmbeddedContext {
  if (typeof window === "undefined") {
    return { embedded: false, returnUrl: null };
  }

  const fromUrl = getEmbeddedContextFromSearchParams(
    new URLSearchParams(window.location.search),
  );

  if (fromUrl.embedded || fromUrl.returnUrl) {
    return fromUrl;
  }

  return readStoredContext();
}

export function isEmbedded() {
  return getEmbeddedContext().embedded;
}

export function getReturnUrl() {
  return getEmbeddedContext().returnUrl;
}

export function persistEmbeddedContext() {
  if (typeof window === "undefined") {
    return;
  }

  const context = getEmbeddedContextFromSearchParams(
    new URLSearchParams(window.location.search),
  );

  if (!context.embedded && !context.returnUrl) {
    return;
  }

  sessionStorage.setItem(EMBEDDED_STORAGE_KEY, JSON.stringify(context));
}

export function withEmbeddedParams(path: string) {
  if (typeof window === "undefined") {
    return path;
  }

  return appendEmbeddedParamsToPath(path, getEmbeddedContext(), window.location.origin);
}

export function goToDashboard(path = "/dashboard") {
  if (typeof window === "undefined") {
    return;
  }

  const target = withEmbeddedParams(path);
  window.location.assign(target);
}

export function navigateEmbedded(path: string) {
  if (typeof window === "undefined") {
    return;
  }

  if (isEmbedded()) {
    window.location.assign(withEmbeddedParams(path));
    return;
  }

  window.location.assign(path);
}

export function returnToHostApp() {
  if (typeof window === "undefined") {
    return;
  }

  const returnUrl = getReturnUrl();

  if (returnUrl) {
    window.location.href = returnUrl;
    return;
  }

  if (window.parent !== window) {
    window.parent.postMessage({ type: "checkmate-academy-return" }, "*");
  }
}

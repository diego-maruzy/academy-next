"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OidcConnectingScreen } from "@/components/auth/oidc-connecting-screen";
import { isLikelyWebView } from "@/lib/auth/detect-webview";
import { getOidcUserManager } from "@/lib/auth/oidc-user-manager";
import {
  createAcademySessionFromTokens,
  hasAcademySession,
  parseHostTokensFromLocation,
  stripHostTokensFromUrl,
} from "@/lib/auth/oidc-session-client";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

type FlowState = "bootstrapping" | "connecting" | "manual" | "authenticated" | "error";

type OidcLoginFlowProps = {
  userAgent?: string;
};

export function OidcLoginFlow({ userAgent = "" }: OidcLoginFlowProps) {
  const searchParams = useSearchParams();
  const destination = useMemo(
    () =>
      resolveStudentCallbackUrl(
        searchParams.get("callbackUrl") ?? searchParams.get("next"),
      ),
    [searchParams],
  );
  const isWebView = useMemo(
    () => isLikelyWebView(userAgent || (typeof navigator !== "undefined" ? navigator.userAgent : "")),
    [userAgent],
  );
  const started = useRef(false);
  const [state, setState] = useState<FlowState>("bootstrapping");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const finishWithDestination = useCallback((target: string) => {
    window.location.assign(target);
  }, []);

  const bootstrapFromHostTokens = useCallback(async () => {
    const tokens = parseHostTokensFromLocation(window.location);

    if (!tokens) {
      return false;
    }

    stripHostTokensFromUrl();
    setState("connecting");

    const result = await createAcademySessionFromTokens(tokens, destination);

    if (!result.ok) {
      setState("error");
      setErrorMessage(
        "Não foi possível validar os tokens recebidos. Toque em continuar para tentar novamente.",
      );
      return true;
    }

    finishWithDestination(result.redirect ?? destination);
    return true;
  }, [destination, finishWithDestination]);

  const startKeycloakRedirect = useCallback(async () => {
    setState("connecting");
    setErrorMessage(null);

    try {
      const manager = getOidcUserManager();
      await manager.signinRedirect({ state: destination });
    } catch {
      setState("manual");
      setErrorMessage(
        "Não foi possível abrir o Keycloak automaticamente. Use o botão abaixo.",
      );
    }
  }, [destination]);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    let redirectTimer: number | undefined;
    let autoStartTimer: number | undefined;
    let fallbackTimer: number | undefined;

    void (async () => {
      const usedHostTokens = await bootstrapFromHostTokens();

      if (usedHostTokens) {
        return;
      }

      const loggedIn = await hasAcademySession();

      if (loggedIn) {
        setState("authenticated");
        redirectTimer = window.setTimeout(
          () => finishWithDestination(destination),
          600,
        );
        return;
      }

      setState(isWebView ? "manual" : "connecting");

      const delayMs = isWebView ? 1000 : 800;
      autoStartTimer = window.setTimeout(() => {
        void startKeycloakRedirect();
      }, delayMs);

      fallbackTimer = window.setTimeout(() => {
        setState((current) =>
          current === "connecting" ? "manual" : current,
        );
      }, isWebView ? 2500 : 4000);
    })();

    return () => {
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }

      if (autoStartTimer) {
        window.clearTimeout(autoStartTimer);
      }

      if (fallbackTimer) {
        window.clearTimeout(fallbackTimer);
      }
    };
  }, [
    bootstrapFromHostTokens,
    destination,
    finishWithDestination,
    isWebView,
    startKeycloakRedirect,
  ]);

  const title =
    state === "authenticated"
      ? "Acesso confirmado"
      : state === "error"
        ? "Não foi possível conectar"
        : "Conectando sua conta Checkmate...";

  const description =
    state === "authenticated"
      ? "Abrindo sua Academy agora."
      : state === "manual" || state === "error"
        ? "Estamos validando seu acesso com segurança. Isso pode levar alguns segundos."
        : "Aguarde um instante enquanto validamos seu acesso.";

  return (
    <OidcConnectingScreen
      title={title}
      description={description}
      showSpinner={state !== "authenticated"}
      showActions={state !== "authenticated" && state !== "bootstrapping"}
      onContinue={() => void startKeycloakRedirect()}
      secondaryHref={`/oidc/login?next=${encodeURIComponent(destination)}`}
      webViewHint={
        isWebView
          ? "Se o acesso não continuar, abra no navegador do dispositivo."
          : undefined
      }
      errorMessage={errorMessage ?? undefined}
    />
  );
}

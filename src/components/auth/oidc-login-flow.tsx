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
  type SessionCreateResult,
} from "@/lib/auth/oidc-session-client";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";
import type { HostTokenValidationCode } from "@/lib/auth/token-inspect";

type FlowState =
  | "bootstrapping"
  | "connecting"
  | "manual"
  | "authenticated"
  | "host_error"
  | "desktop_fallback";

type OidcLoginFlowProps = {
  userAgent?: string;
};

const HOST_ERROR_MESSAGES: Partial<Record<HostTokenValidationCode, string>> = {
  missing_token: "Nenhum token de acesso foi recebido do app Checkmate.",
  missing_id_token: "O app não enviou id_token. Verifique a integração do Property.",
  invalid_issuer: "O token não pertence ao realm Checkmate esperado.",
  invalid_audience:
    "O client do token não está autorizado para entrar na Academy.",
  token_expired: "Sua sessão do Checkmate expirou. Faça login novamente no app.",
  signature_invalid: "Não foi possível validar a assinatura do token.",
  jwks_error: "Falha temporária ao validar o token. Tente novamente.",
  missing_email: "O token não contém email utilizável.",
  missing_sub: "O token não contém identificador do usuário.",
  malformed_token: "O token recebido está malformado.",
  token_truncated:
    "O token parece ter sido cortado na URL. Isso é comum em WebViews.",
  session_failed: "Os tokens foram válidos, mas a sessão da Academy não foi criada.",
};

function getPublicErrorMessage(result: SessionCreateResult) {
  if (result.message) {
    return result.message;
  }

  if (result.error && result.error in HOST_ERROR_MESSAGES) {
    return HOST_ERROR_MESSAGES[result.error as HostTokenValidationCode]!;
  }

  return "Não foi possível validar os tokens recebidos do app Checkmate.";
}

function getDebugErrorMessage(result: SessionCreateResult) {
  const code = result.error ?? result.debug?.code ?? "unknown";
  return `debug: ${code}`;
}

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
    () =>
      isLikelyWebView(
        userAgent ||
          (typeof navigator !== "undefined" ? navigator.userAgent : ""),
      ),
    [userAgent],
  );
  const started = useRef(false);
  const [state, setState] = useState<FlowState>("bootstrapping");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const showDebug =
    process.env.NODE_ENV === "development" ||
    searchParams.get("debug") === "1";

  const finishWithDestination = useCallback((target: string) => {
    window.location.assign(target);
  }, []);

  const bootstrapFromHostTokens = useCallback(async () => {
    const tokens = parseHostTokensFromLocation(window.location);

    if (!tokens) {
      return false;
    }

    setState("connecting");

    const result = await createAcademySessionFromTokens(tokens, destination, {
      authSource: "host-tokens",
      debug: showDebug,
    });

    if (!result.ok) {
      if (isWebView) {
        setState("host_error");
      } else {
        setState("desktop_fallback");
      }

      setErrorMessage(getPublicErrorMessage(result));
      setDebugMessage(getDebugErrorMessage(result));
      return true;
    }

    stripHostTokensFromUrl();
    finishWithDestination(result.redirect ?? destination);
    return true;
  }, [destination, finishWithDestination, isWebView, showDebug]);

  const startKeycloakRedirect = useCallback(async () => {
    setState("connecting");
    setErrorMessage(null);
    setDebugMessage(null);

    try {
      const manager = getOidcUserManager();
      await manager.signinRedirect({ state: destination });
    } catch {
      setState(isWebView ? "host_error" : "manual");
      setErrorMessage(
        "Não foi possível abrir o Keycloak automaticamente. Use o botão abaixo.",
      );
    }
  }, [destination, isWebView]);

  const openInBrowser = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.delete("debug");
    window.open(url.toString(), "_blank");
  }, []);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    let redirectTimer: number | undefined;
    let autoStartTimer: number | undefined;

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

      if (isWebView) {
        setState("host_error");
        setErrorMessage(
          "Abra a Academy pelo app Checkmate com sua conta já logada.",
        );
        return;
      }

      setState("connecting");
      autoStartTimer = window.setTimeout(() => {
        void startKeycloakRedirect();
      }, 800);
    })();

    return () => {
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }

      if (autoStartTimer) {
        window.clearTimeout(autoStartTimer);
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
      : state === "host_error"
        ? "Não foi possível entrar automaticamente"
        : state === "desktop_fallback"
          ? "Não foi possível validar os tokens"
          : "Conectando sua conta Checkmate...";

  const description =
    state === "authenticated"
      ? "Abrindo sua Academy agora."
      : state === "host_error"
        ? errorMessage ??
          "Volte ao app Checkmate, confirme que está logado e tente acessar a Academy novamente."
        : state === "desktop_fallback"
          ? errorMessage ??
            "Os tokens recebidos não puderam ser validados."
          : "Aguarde um instante enquanto validamos seu acesso.";

  const showSpinner =
    state === "bootstrapping" || state === "connecting" || state === "authenticated";

  const showActions = state === "host_error" || state === "desktop_fallback" || state === "manual";

  return (
    <OidcConnectingScreen
      title={title}
      description={description}
      showSpinner={showSpinner}
      showActions={showActions}
      actionLabel={
        state === "desktop_fallback" ? "Continuar com Keycloak" : "Tentar novamente"
      }
      onContinue={() => {
        if (state === "desktop_fallback") {
          void startKeycloakRedirect();
          return;
        }

        window.location.assign("/oidc/login");
      }}
      secondaryHref={
        state === "desktop_fallback"
          ? `/oidc/login?next=${encodeURIComponent(destination)}`
          : undefined
      }
      secondaryLabel="Abrir login em nova tentativa"
      webViewHint={
        isWebView
          ? "Se o acesso não continuar, abra no navegador do dispositivo."
          : undefined
      }
      errorMessage={
        showDebug && debugMessage ? debugMessage : undefined
      }
      extraActions={
        isWebView && state === "host_error" ? (
          <button
            type="button"
            onClick={openInBrowser}
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Abrir login no navegador
          </button>
        ) : null
      }
    />
  );
}

"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OidcConnectingScreen } from "@/components/auth/oidc-connecting-screen";
import {
  buildPathWithEmbeddedParams,
  getEmbeddedContextFromSearchParams,
} from "@/lib/embedded-params";
import {
  getEmbeddedContext,
  isEmbedded,
  persistEmbeddedContext,
  returnToHostApp,
  withEmbeddedParams,
} from "@/lib/embedded";
import { isLikelyWebView } from "@/lib/auth/detect-webview";
import { logEmbeddedNavigation } from "@/lib/auth/oidc-debug-log";
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
  const destination = useMemo(() => {
    const base = resolveStudentCallbackUrl(
      searchParams.get("callbackUrl") ?? searchParams.get("next"),
    );

    return buildPathWithEmbeddedParams(base, searchParams);
  }, [searchParams]);
  const embeddedContext = useMemo(
    () => getEmbeddedContextFromSearchParams(searchParams),
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
  const isEmbeddedFlow = isEmbedded() || isWebView;
  const started = useRef(false);
  const [state, setState] = useState<FlowState>("bootstrapping");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const showDebug =
    process.env.NODE_ENV === "development" ||
    searchParams.get("debug") === "1";

  useEffect(() => {
    persistEmbeddedContext();
  }, []);

  const finishWithDestination = useCallback(
    (target: string) => {
      const nextTarget = withEmbeddedParams(target);

      logEmbeddedNavigation({
        userAgent,
        from: window.location.pathname,
        to: nextTarget,
        embedded: embeddedContext,
        action: "dashboard",
      });

      window.location.assign(nextTarget);
    },
    [embeddedContext, userAgent],
  );

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
      if (isEmbeddedFlow) {
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
  }, [destination, finishWithDestination, isEmbeddedFlow, showDebug]);

  const startKeycloakRedirect = useCallback(async () => {
    setState("connecting");
    setErrorMessage(null);
    setDebugMessage(null);

    try {
      const manager = getOidcUserManager();
      await manager.signinRedirect({ state: destination });
    } catch {
      setState(isEmbeddedFlow ? "host_error" : "manual");
      setErrorMessage(
        "Não foi possível abrir o Keycloak automaticamente. Use o botão abaixo.",
      );
    }
  }, [destination, isEmbeddedFlow]);

  const retryLogin = useCallback(() => {
    const retryPath = withEmbeddedParams("/oidc/login");

    logEmbeddedNavigation({
      userAgent,
      from: window.location.pathname,
      to: retryPath,
      embedded: embeddedContext,
      action: "retry",
    });

    window.location.assign(retryPath);
  }, [embeddedContext, userAgent]);

  const handleReturnToHost = useCallback(() => {
    logEmbeddedNavigation({
      userAgent,
      from: window.location.pathname,
      to: getEmbeddedContext().returnUrl ?? "postMessage",
      embedded: embeddedContext,
      action: "return-host",
    });

    returnToHostApp();
  }, [embeddedContext, userAgent]);

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

      if (isEmbeddedFlow) {
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
    isEmbeddedFlow,
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
          ? errorMessage ?? "Os tokens recebidos não puderam ser validados."
          : "Aguarde um instante enquanto validamos seu acesso.";

  const showSpinner =
    state === "bootstrapping" ||
    state === "connecting" ||
    state === "authenticated";

  const showActions =
    state === "host_error" ||
    state === "desktop_fallback" ||
    state === "manual";

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

        retryLogin();
      }}
      secondaryHref={
        state === "desktop_fallback"
          ? withEmbeddedParams(
              `/oidc/login?next=${encodeURIComponent(destination.split("?")[0])}`,
            )
          : undefined
      }
      secondaryLabel="Abrir login em nova tentativa"
      webViewHint={
        isEmbeddedFlow && !isEmbedded()
          ? "Se o acesso não continuar, abra no navegador do dispositivo."
          : undefined
      }
      errorMessage={showDebug && debugMessage ? debugMessage : undefined}
      extraActions={
        isEmbeddedFlow && state === "host_error" ? (
          <button
            type="button"
            onClick={handleReturnToHost}
            className="h-11 w-full rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
          >
            Voltar ao app
          </button>
        ) : null
      }
    />
  );
}

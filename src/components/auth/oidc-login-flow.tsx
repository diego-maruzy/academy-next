"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { OidcConnectingScreen } from "@/components/auth/oidc-connecting-screen";
import { OidcBridgeDebugPanel } from "@/components/auth/oidc-bridge-debug-panel";
import {
  buildPathWithEmbeddedParams,
  getEmbeddedContextFromSearchParams,
} from "@/lib/embedded-params";
import {
  getEmbeddedContext,
  isEmbedded,
  persistEmbeddedContext,
  requestHostLogin,
  returnToHostApp,
  withEmbeddedParams,
} from "@/lib/embedded";
import { isLikelyWebView } from "@/lib/auth/detect-webview";
import { isHostSessionExpiredError } from "@/lib/auth/refresh-token-errors";
import { logEmbeddedNavigation } from "@/lib/auth/oidc-debug-log";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";
import {
  getManager,
  getUser,
  hasValidOidcUser,
  isLoginRequiredError,
  login,
  loginWithPromptNone,
  trySilentSso,
} from "@/lib/oidc/auth-service";
import {
  bootstrapFromHostTokens,
  hasHostTokensInUrl,
  stripHostTokensFromUrl,
} from "@/lib/oidc/host-sso";
import {
  hasSbAuthTokenInLocalStorage,
  provisionAndBridgeSupabase,
  syncAuthJsSessionInBackground,
  type OidcBridgeDebugState,
  type ProvisionAndBridgeResult,
} from "@/lib/oidc/supabase-bridge";

type FlowState =
  | "bootstrapping"
  | "connecting"
  | "manual"
  | "host_error"
  | "host_session_expired"
  | "desktop_fallback";

type OidcLoginFlowProps = {
  userAgent?: string;
};

const HOST_ERROR_MESSAGES: Record<string, string> = {
  missing_token: "Nenhum token de acesso foi recebido do app Checkmate.",
  invalid_issuer: "O token não pertence ao realm Checkmate esperado.",
  host_session_expired: "Sua sessão expirou. Toque para entrar novamente.",
  missing_email: "O token não contém email utilizável.",
  missing_sub: "O token não contém identificador do usuário.",
  provision_failed: "Não foi possível provisionar sua conta na Academy.",
  supabase_bridge_failed: "Falha ao preparar o acesso Supabase.",
  verify_otp_failed: "Falha ao validar o acesso Supabase.",
  supabase_session_not_persisted:
    "Sessão Supabase não foi persistida no browser.",
  supabase_bridge_not_called: "Bridge Supabase não foi executado.",
  missing_supabase_service_role:
    "Configuração Supabase incompleta (service role ausente).",
};

function getPublicErrorMessage(code?: string, fallback?: string) {
  if (code && code in HOST_ERROR_MESSAGES) {
    return HOST_ERROR_MESSAGES[code]!;
  }

  return (
    fallback ?? "Não foi possível criar a sessão Supabase. Tente novamente."
  );
}

function createEmptyDebugState(): OidcBridgeDebugState {
  return {
    oidc_user_ready: false,
    provision_called: false,
    bridge_called: false,
    bridge_ok: false,
    verify_otp_ok: false,
    supabase_session_persisted: false,
    redirect_started: false,
    last_error: null,
  };
}

function detectTokensInUrl(
  searchParams: URLSearchParams,
  location: Location = window.location,
) {
  if (hasHostTokensInUrl(location)) {
    return true;
  }

  return (
    searchParams.has("access_token") ||
    searchParams.has("id_token") ||
    searchParams.has("refresh_token")
  );
}

function applyBridgeDebug(
  setBridgeDebug: (debug: OidcBridgeDebugState) => void,
  result: ProvisionAndBridgeResult,
) {
  setBridgeDebug(result.debug);
}

function setBridgeFailure(
  setState: (state: FlowState) => void,
  setErrorMessage: (message: string | null) => void,
  setDebugMessage: (message: string | null) => void,
  setBridgeDebug: (debug: OidcBridgeDebugState) => void,
  result: ProvisionAndBridgeResult,
  isEmbeddedFlow: boolean,
) {
  applyBridgeDebug(setBridgeDebug, result);
  setState(isEmbeddedFlow ? "host_error" : "desktop_fallback");
  setErrorMessage(
    getPublicErrorMessage(result.code, result.message ?? "Falha ao criar sessão Supabase."),
  );
  setDebugMessage(`debug: ${result.code}`);
}

async function continueDesktopOidcFlow(
  destination: string,
  runBridgeAndRedirect: (target: string) => Promise<boolean>,
  startKeycloakRedirect: () => Promise<void>,
  setState: (state: FlowState) => void,
  setErrorMessage: (message: string | null) => void,
) {
  setState("connecting");

  const silentUser = await trySilentSso();

  if (silentUser && !silentUser.expired) {
    await runBridgeAndRedirect(destination);
    return;
  }

  try {
    await loginWithPromptNone(destination);
    return;
  } catch (error) {
    if (!isLoginRequiredError(error)) {
      setState("manual");
      setErrorMessage(
        "Não foi possível restaurar sua sessão automaticamente.",
      );
      return;
    }
  }

  window.setTimeout(() => {
    void startKeycloakRedirect();
  }, 800);
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
  const flowStarted = useRef(false);
  const [state, setState] = useState<FlowState>("bootstrapping");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);
  const [manualBridgeResult, setManualBridgeResult] = useState<string | null>(
    null,
  );
  const [bridgeDebug, setBridgeDebug] = useState<OidcBridgeDebugState>(
    createEmptyDebugState(),
  );
  const [manualBridgeLoading, setManualBridgeLoading] = useState(false);
  const showDebug =
    process.env.NODE_ENV === "development" ||
    searchParams.get("debug") === "1";

  const initialUrlHadTokens = useRef(
    typeof window !== "undefined"
      ? detectTokensInUrl(searchParams, window.location)
      : false,
  );

  useEffect(() => {
    console.info("[OIDC]", { step: "oidc_login_component_mounted" });
    persistEmbeddedContext();
  }, []);

  const redirectToDashboard = useCallback(
    (target: string) => {
      const nextTarget = withEmbeddedParams(target);

      console.info("[OIDC]", { step: "redirect_dashboard" });

      logEmbeddedNavigation({
        userAgent,
        from: window.location.pathname,
        to: nextTarget,
        embedded: embeddedContext,
        action: "dashboard",
      });

      setBridgeDebug((current) => ({
        ...current,
        redirect_started: true,
      }));

      window.location.assign(nextTarget);
    },
    [embeddedContext, userAgent],
  );

  const runBridgeAndRedirect = useCallback(
    async (
      targetDestination: string,
      userOverride?: Awaited<ReturnType<typeof getUser>>,
      source = "oidc-login",
    ) => {
      setState("connecting");
      setErrorMessage(null);
      setDebugMessage(null);

      const user = userOverride ?? (await getUser());

      if (!user || user.expired) {
        const debug = createEmptyDebugState();
        debug.last_error = "oidc_user_invalid";
        setBridgeDebug(debug);

        if (isEmbeddedFlow) {
          setState("host_session_expired");
          setErrorMessage("Sua sessão expirou. Toque para entrar novamente.");
        } else {
          setState("desktop_fallback");
          setErrorMessage("Sessão OIDC inválida após login.");
        }

        return false;
      }

      const bridgeResult = await provisionAndBridgeSupabase(user, {
        debug: showDebug,
        source,
        force: source === "oidc-login-manual",
      });

      console.info("[OIDC]", {
        step: "bridge_result_before_redirect",
        ok: bridgeResult.ok,
        code: bridgeResult.code,
        hasSession: bridgeResult.hasSession,
        provisionCalled: bridgeResult.provisionCalled,
        bridgeCalled: bridgeResult.bridgeCalled,
        verifyOtpOk: bridgeResult.verifyOtpOk,
      });

      applyBridgeDebug(setBridgeDebug, bridgeResult);

      if (!bridgeResult.ok || !bridgeResult.hasSession) {
        setBridgeFailure(
          setState,
          setErrorMessage,
          setDebugMessage,
          setBridgeDebug,
          bridgeResult,
          isEmbeddedFlow,
        );
        return false;
      }

      stripHostTokensFromUrl();
      syncAuthJsSessionInBackground(user);
      redirectToDashboard(targetDestination);
      return true;
    },
    [isEmbeddedFlow, redirectToDashboard, showDebug],
  );

  const runBootstrapTokensPath = useCallback(async (): Promise<
    { ok: true } | { ok: false; code: string; message?: string }
  > => {
    console.info("[OIDC]", { step: "tokens_in_url_detected" });

    const bootstrapped = await bootstrapFromHostTokens(window.location, {
      stripUrl: false,
    });

    console.info("[OIDC]", {
      step: "bootstrap_result",
      ok: bootstrapped.ok,
      code: bootstrapped.ok ? undefined : bootstrapped.code,
    });

    if (!bootstrapped.ok) {
      return {
        ok: false,
        code: bootstrapped.code,
        message: bootstrapped.message,
      };
    }

    const user = await getManager().getUser();
    const bridgeUser = bootstrapped.user ?? user;

    console.info("[OIDC]", {
      step: "after_bootstrap_user_loaded",
      hasUser: Boolean(bridgeUser),
      hasEmail: Boolean(bridgeUser?.profile?.email),
      hasAccessToken: Boolean(bridgeUser?.access_token),
      hasIdToken: Boolean(bridgeUser?.id_token),
    });

    if (!bridgeUser || bridgeUser.expired) {
      return { ok: false, code: "oidc_user_invalid" };
    }

    const bridgeResult = await provisionAndBridgeSupabase(bridgeUser, {
      debug: showDebug,
      source: "oidc-login-bootstrap",
      force: true,
    });

    console.info("[OIDC]", {
      step: "bridge_result_before_redirect",
      ok: bridgeResult.ok,
      code: bridgeResult.code,
      hasSession: bridgeResult.hasSession,
      provisionCalled: bridgeResult.provisionCalled,
      bridgeCalled: bridgeResult.bridgeCalled,
      verifyOtpOk: bridgeResult.verifyOtpOk,
    });

    applyBridgeDebug(setBridgeDebug, bridgeResult);

    if (!bridgeResult.ok || !bridgeResult.hasSession) {
      setBridgeFailure(
        setState,
        setErrorMessage,
        setDebugMessage,
        setBridgeDebug,
        bridgeResult,
        isEmbeddedFlow,
      );
      return { ok: false as const, code: bridgeResult.code };
    }

    stripHostTokensFromUrl();
    syncAuthJsSessionInBackground(bootstrapped.user);
    redirectToDashboard(destination);
    return { ok: true as const };
  }, [
    destination,
    isEmbeddedFlow,
    redirectToDashboard,
    showDebug,
  ]);

  const handleManualBridge = useCallback(async () => {
    setManualBridgeLoading(true);
    setManualBridgeResult(null);

    try {
      const user = await getManager().getUser();

      if (!user || user.expired) {
        setManualBridgeResult("erro: oidc_user_invalid");
        return;
      }

      const result = await provisionAndBridgeSupabase(user, {
        debug: true,
        source: "oidc-login-manual",
        force: true,
      });

      applyBridgeDebug(setBridgeDebug, result);

      const hasSb = hasSbAuthTokenInLocalStorage();

      setManualBridgeResult(
        [
          `ok: ${result.ok}`,
          `code: ${result.code}`,
          `provisionCalled: ${result.provisionCalled}`,
          `bridgeCalled: ${result.bridgeCalled}`,
          `verifyOtpOk: ${result.verifyOtpOk}`,
          `hasSession: ${result.hasSession}`,
          `sb-localStorage: ${hasSb}`,
        ].join(" | "),
      );
    } catch (error) {
      setManualBridgeResult(
        `erro: ${error instanceof Error ? error.message : "unknown"}`,
      );
    } finally {
      setManualBridgeLoading(false);
    }
  }, []);

  const startKeycloakRedirect = useCallback(async () => {
    setState("connecting");
    setErrorMessage(null);
    setDebugMessage(null);

    try {
      await login(destination);
    } catch {
      setState(isEmbeddedFlow ? "host_error" : "manual");
      setErrorMessage(
        "Não foi possível abrir o Keycloak automaticamente. Use o botão abaixo.",
      );
    }
  }, [destination, isEmbeddedFlow]);

  const handleHostReLogin = useCallback(() => {
    logEmbeddedNavigation({
      userAgent,
      from: window.location.pathname,
      to: getEmbeddedContext().returnUrl ?? "postMessage",
      embedded: embeddedContext,
      action: "request-host-login",
    });

    requestHostLogin();
  }, [embeddedContext, userAgent]);

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
    if (flowStarted.current) {
      return;
    }

    flowStarted.current = true;

    void (async () => {
      const hasTokensNow =
        detectTokensInUrl(searchParams) ||
        initialUrlHadTokens.current ||
        hasHostTokensInUrl();

      if (hasTokensNow) {
        const bootstrapOutcome = await runBootstrapTokensPath();

        if (bootstrapOutcome.ok) {
          return;
        }

        const code = bootstrapOutcome.code;

        if (code === "missing_token") {
          // Tokens sumiram da URL antes do bootstrap; segue para fallback abaixo.
        } else {
          const sessionExpired = isHostSessionExpiredError({ code });

          if (sessionExpired && isEmbeddedFlow) {
            setState("host_session_expired");
            setErrorMessage("Sua sessão expirou. Toque para entrar novamente.");
            setDebugMessage(showDebug ? `debug: ${code}` : null);
            return;
          }

          if (sessionExpired && !isEmbeddedFlow) {
            await continueDesktopOidcFlow(
              destination,
              runBridgeAndRedirect,
              startKeycloakRedirect,
              setState,
              setErrorMessage,
            );
            return;
          }

          setState(isEmbeddedFlow ? "host_error" : "desktop_fallback");
          setErrorMessage(
            getPublicErrorMessage(code, bootstrapOutcome.message),
          );
          setDebugMessage(`debug: ${code}`);
          return;
        }
      }

      if (await hasValidOidcUser()) {
        await runBridgeAndRedirect(destination, undefined, "oidc-login-existing-user");
        return;
      }

      if (isEmbeddedFlow) {
        setState("host_error");
        setErrorMessage(
          "Abra a Academy pelo app Checkmate com sua conta já logada.",
        );
        return;
      }

      await continueDesktopOidcFlow(
        destination,
        runBridgeAndRedirect,
        startKeycloakRedirect,
        setState,
        setErrorMessage,
      );
    })();
  }, [
    destination,
    isEmbeddedFlow,
    runBootstrapTokensPath,
    runBridgeAndRedirect,
    searchParams,
    showDebug,
    startKeycloakRedirect,
  ]);

  const title =
    state === "host_session_expired"
      ? "Sua sessão expirou"
      : state === "host_error"
        ? "Não foi possível entrar automaticamente"
        : state === "desktop_fallback"
          ? "Não foi possível validar os tokens"
          : "Conectando sua conta Checkmate...";

  const description =
    state === "host_session_expired"
      ? (errorMessage ?? "Sua sessão expirou. Toque para entrar novamente.")
      : state === "host_error"
        ? (errorMessage ??
          "Volte ao app Checkmate, confirme que está logado e tente acessar a Academy novamente.")
        : state === "desktop_fallback"
          ? (errorMessage ?? "Os tokens recebidos não puderam ser validados.")
          : "Aguarde enquanto criamos sua sessão Supabase com segurança.";

  const showSpinner = state === "bootstrapping" || state === "connecting";

  const showActions =
    state === "host_error" ||
    state === "host_session_expired" ||
    state === "desktop_fallback" ||
    state === "manual";

  return (
    <OidcConnectingScreen
      title={title}
      description={description}
      showSpinner={showSpinner}
      showActions={showActions}
      actionLabel={
        state === "host_session_expired"
          ? "Entrar novamente"
          : state === "desktop_fallback"
            ? "Continuar com Keycloak"
            : "Tentar novamente"
      }
      onContinue={() => {
        if (state === "host_session_expired") {
          handleHostReLogin();
          return;
        }

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
      errorMessage={
        showDebug && (debugMessage || errorMessage)
          ? (debugMessage ?? errorMessage ?? undefined)
          : errorMessage && state !== "bootstrapping" && state !== "connecting"
            ? errorMessage
            : undefined
      }
      extraActions={
        <>
          {showDebug ? (
            <>
              <OidcBridgeDebugPanel debug={bridgeDebug} />
              <button
                type="button"
                disabled={manualBridgeLoading}
                onClick={() => void handleManualBridge()}
                className="mt-3 h-11 w-full rounded-xl border border-amber-400/30 bg-amber-400/10 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-50"
              >
                {manualBridgeLoading
                  ? "Executando bridge..."
                  : "Executar bridge Supabase agora"}
              </button>
              {manualBridgeResult ? (
                <p className="mt-2 text-left text-[0.65rem] font-mono leading-relaxed text-amber-200">
                  {manualBridgeResult}
                </p>
              ) : null}
            </>
          ) : null}
          {isEmbeddedFlow && state === "host_error" ? (
            <button
              type="button"
              onClick={handleReturnToHost}
              className="h-11 w-full rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
            >
              Voltar ao app
            </button>
          ) : null}
        </>
      }
    />
  );
}

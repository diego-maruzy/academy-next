"use client";

import { useEffect, useRef, useState } from "react";
import {
  getEmbeddedContext,
  isEmbedded,
  persistEmbeddedContext,
  returnToHostApp,
  withEmbeddedParams,
} from "@/lib/embedded";
import { logEmbeddedNavigation } from "@/lib/auth/oidc-debug-log";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";
import { handleCallback } from "@/lib/oidc/auth-service";
import {
  provisionAndBridgeSupabaseWithTimeout,
  syncAuthJsSessionInBackground,
} from "@/lib/oidc/supabase-bridge";
import { OidcConnectingScreen } from "@/components/auth/oidc-connecting-screen";

export function OidcCallbackFlow() {
  const started = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [debugMessage, setDebugMessage] = useState<string | null>(null);

  useEffect(() => {
    persistEmbeddedContext();
  }, []);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    void (async () => {
      try {
        const user = await handleCallback();
        const rawDestination = resolveStudentCallbackUrl(
          typeof user.state === "string" ? user.state : undefined,
        );
        const destination = withEmbeddedParams(rawDestination);

        const bridgeResult = await provisionAndBridgeSupabaseWithTimeout(user, {
          source: "oidc-callback",
          force: true,
        });

        if (!bridgeResult.ok || !bridgeResult.hasSession) {
          setDebugMessage(`debug: ${bridgeResult.code}`);
          throw new Error(bridgeResult.code);
        }

        syncAuthJsSessionInBackground(user);

        console.info("[OIDC]", { step: "redirect_dashboard" });

        logEmbeddedNavigation({
          from: "/auth/callback",
          to: destination,
          embedded: getEmbeddedContext(),
          action: "dashboard",
        });

        window.location.assign(destination);
      } catch (error) {
        const code =
          error instanceof Error ? error.message : "post_login_failed";

        setErrorMessage(
          code === "verify_otp_failed"
            ? "Falha ao validar o acesso Supabase."
            : "Não foi possível concluir o login. Volte e tente novamente.",
        );
      }
    })();
  }, []);

  return (
    <OidcConnectingScreen
      title={
        errorMessage
          ? "Não foi possível concluir o login"
          : "Finalizando seu acesso..."
      }
      description={
        errorMessage
          ? "Use o botão abaixo para voltar ao início do login."
          : "Estamos criando sua sessão Supabase com segurança."
      }
      showSpinner={!errorMessage}
      showActions={Boolean(errorMessage)}
      actionLabel={isEmbedded() ? "Voltar ao app" : "Voltar ao login"}
      onContinue={() => {
        if (isEmbedded()) {
          returnToHostApp();
          return;
        }

        window.location.assign(withEmbeddedParams("/oidc/login"));
      }}
      errorMessage={debugMessage ?? errorMessage ?? undefined}
    />
  );
}

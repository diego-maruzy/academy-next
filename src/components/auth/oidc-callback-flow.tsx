"use client";

import { useEffect, useRef, useState } from "react";
import { OidcConnectingScreen } from "@/components/auth/oidc-connecting-screen";
import {
  getEmbeddedContext,
  isEmbedded,
  persistEmbeddedContext,
  returnToHostApp,
  withEmbeddedParams,
} from "@/lib/embedded";
import { logEmbeddedNavigation } from "@/lib/auth/oidc-debug-log";
import { getOidcUserManager } from "@/lib/auth/oidc-user-manager";
import { createAcademySessionFromTokens } from "@/lib/auth/oidc-session-client";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

export function OidcCallbackFlow() {
  const started = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
        const manager = getOidcUserManager();
        const user = await manager.signinRedirectCallback();
        const rawDestination = resolveStudentCallbackUrl(
          typeof user.state === "string" ? user.state : undefined,
        );
        const destination = withEmbeddedParams(rawDestination);

        if (!user.id_token) {
          throw new Error("missing_id_token");
        }

        const result = await createAcademySessionFromTokens(
          {
            id_token: user.id_token,
            access_token: user.access_token ?? "",
          },
          destination,
          { authSource: "oidc-callback" },
        );

        await manager.removeUser();

        if (!result.ok) {
          throw new Error(result.error ?? "session_failed");
        }

        const nextTarget = withEmbeddedParams(
          result.redirect ?? destination,
        );

        logEmbeddedNavigation({
          from: "/auth/callback",
          to: nextTarget,
          embedded: getEmbeddedContext(),
          action: "dashboard",
        });

        window.location.assign(nextTarget);
      } catch {
        setErrorMessage(
          "Não foi possível concluir o login. Volte e tente novamente.",
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
          : "Estamos criando sua sessão com segurança."
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
      errorMessage={errorMessage ?? undefined}
    />
  );
}

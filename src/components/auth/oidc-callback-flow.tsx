"use client";

import { useEffect, useRef, useState } from "react";
import { OidcConnectingScreen } from "@/components/auth/oidc-connecting-screen";
import { getOidcUserManager } from "@/lib/auth/oidc-user-manager";
import { createAcademySessionFromTokens } from "@/lib/auth/oidc-session-client";
import { resolveStudentCallbackUrl } from "@/lib/auth/route-guard";

export function OidcCallbackFlow() {
  const started = useRef(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    void (async () => {
      try {
        const manager = getOidcUserManager();
        const user = await manager.signinRedirectCallback();
        const destination = resolveStudentCallbackUrl(
          typeof user.state === "string" ? user.state : undefined,
        );

        if (!user.id_token) {
          throw new Error("missing_id_token");
        }

        const result = await createAcademySessionFromTokens(
          {
            id_token: user.id_token,
            access_token: user.access_token ?? "",
          },
          destination,
        );

        await manager.removeUser();

        if (!result.ok) {
          throw new Error(result.error ?? "session_failed");
        }

        window.location.assign(result.redirect ?? destination);
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
      actionLabel="Voltar ao login"
      onContinue={() => {
        window.location.assign("/oidc/login");
      }}
      errorMessage={errorMessage ?? undefined}
    />
  );
}

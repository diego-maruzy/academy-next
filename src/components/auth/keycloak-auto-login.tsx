"use client";

import { signIn } from "next-auth/react";
import { useCallback, useEffect, useRef, useState } from "react";

const AUTO_LOGIN_DELAY_MS = 500;
const FALLBACK_BUTTON_DELAY_MS = 6000;

type KeycloakAutoLoginProps = {
  callbackUrl?: string;
};

type LoginStatus = "waiting" | "redirecting" | "fallback" | "error";

async function startKeycloakLogin(callbackUrl: string) {
  const result = await signIn("keycloak", { callbackUrl, redirect: false });

  if (result?.error) {
    throw new Error(result.error);
  }

  if (result?.url) {
    window.location.assign(result.url);
    return;
  }

  throw new Error("missing_redirect_url");
}

export function KeycloakAutoLogin({
  callbackUrl = "/dashboard",
}: KeycloakAutoLoginProps) {
  const [status, setStatus] = useState<LoginStatus>("waiting");
  const hasStarted = useRef(false);

  const triggerLogin = useCallback(async () => {
    setStatus("redirecting");

    try {
      await startKeycloakLogin(callbackUrl);
    } catch {
      setStatus("error");
    }
  }, [callbackUrl]);

  useEffect(() => {
    if (hasStarted.current) {
      return;
    }

    hasStarted.current = true;

    const loginTimer = window.setTimeout(() => {
      void triggerLogin();
    }, AUTO_LOGIN_DELAY_MS);

    const fallbackTimer = window.setTimeout(() => {
      setStatus((current) =>
        current === "waiting" || current === "redirecting" ? "fallback" : current,
      );
    }, FALLBACK_BUTTON_DELAY_MS);

    return () => {
      window.clearTimeout(loginTimer);
      window.clearTimeout(fallbackTimer);
    };
  }, [triggerLogin]);

  const showFallbackButton = status === "fallback" || status === "error";
  const title =
    status === "error"
      ? "Não foi possível iniciar o login automaticamente."
      : "Redirecionando para o acesso Checkmate...";
  const subtitle =
    status === "error"
      ? "Tente novamente para continuar com sua conta Checkmate."
      : "Aguarde um instante enquanto conectamos sua conta.";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050814] px-5 py-10">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500 text-2xl font-black text-white shadow-lg shadow-blue-500/30">
            C
            {!showFallbackButton ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-60" />
                <span className="relative inline-flex h-5 w-5 rounded-full border-2 border-[#050814] bg-sky-400" />
              </span>
            ) : null}
          </div>

          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Checkmate Academy
          </p>

          <h1 className="mt-4 text-xl font-semibold text-white">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">{subtitle}</p>

          {!showFallbackButton ? (
            <div className="mt-8 flex items-center gap-3 text-sm text-slate-300">
              <Spinner />
              <span>{status === "redirecting" ? "Conectando..." : "Preparando acesso..."}</span>
            </div>
          ) : (
            <div className="mt-8 flex w-full flex-col gap-3">
              <button
                type="button"
                onClick={() => void triggerLogin()}
                className="h-11 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
              >
                {status === "error" ? "Tentar novamente" : "Continuar login"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400"
      aria-hidden
    />
  );
}

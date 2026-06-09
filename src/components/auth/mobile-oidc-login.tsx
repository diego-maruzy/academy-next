"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { buildOidcStartUrl } from "@/lib/auth/oidc-callback-url";
import { isLikelyWebView } from "@/lib/auth/detect-webview";

type MobileOidcLoginProps = {
  destination: string;
  userAgent: string;
  alreadyAuthenticated?: boolean;
  startError?: boolean;
};

type ViewState = "connecting" | "manual" | "authenticated";

export function MobileOidcLogin({
  destination,
  userAgent,
  alreadyAuthenticated = false,
  startError = false,
}: MobileOidcLoginProps) {
  const isWebView = useMemo(() => isLikelyWebView(userAgent), [userAgent]);
  const startUrl = useMemo(
    () => buildOidcStartUrl(destination),
    [destination],
  );
  const autoStarted = useRef(false);
  const [state, setState] = useState<ViewState>(
    alreadyAuthenticated ? "authenticated" : startError || isWebView ? "manual" : "connecting",
  );

  function navigateToStart() {
    window.location.assign(startUrl);
  }

  useEffect(() => {
    if (alreadyAuthenticated) {
      const timer = window.setTimeout(() => {
        window.location.assign(destination);
      }, 600);

      return () => window.clearTimeout(timer);
    }

    if (autoStarted.current) {
      return;
    }

    autoStarted.current = true;

    const delayMs = isWebView ? 1200 : 800;
    const timer = window.setTimeout(() => {
      navigateToStart();
    }, delayMs);

    const fallbackTimer = window.setTimeout(() => {
      setState("manual");
    }, isWebView ? 2500 : 4000);

    return () => {
      window.clearTimeout(timer);
      window.clearTimeout(fallbackTimer);
    };
  }, [alreadyAuthenticated, destination, isWebView]);

  const title =
    state === "authenticated"
      ? "Acesso confirmado"
      : "Conectando sua conta Checkmate...";

  const description =
    state === "authenticated"
      ? "Abrindo sua Academy agora."
      : state === "manual"
        ? "Estamos validando seu acesso com segurança. Isso pode levar alguns segundos."
        : "Aguarde um instante enquanto validamos seu acesso.";

  return (
    <div className="min-h-screen min-h-[100dvh] bg-[#0f172a] px-5 py-10 text-[#f8fafc]">
      <div className="mx-auto flex min-h-[calc(100dvh-5rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-[1.25rem] border border-white/10 bg-[#1e293b] p-8 text-center shadow-2xl shadow-black/30">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-500 text-xl font-black text-white">
            C
          </div>

          <p className="text-[0.65rem] font-semibold uppercase tracking-[0.24em] text-slate-500">
            Checkmate Academy
          </p>

          <h1 className="mt-4 text-lg font-semibold text-white">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-400">
            {description}
          </p>

          {state !== "authenticated" ? (
            <div
              className="mx-auto mt-6 h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400"
              aria-hidden
            />
          ) : null}

          {state !== "authenticated" ? (
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={navigateToStart}
                className="h-11 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
              >
                Continuar acesso
              </button>

              <a
                href={startUrl}
                className="text-sm font-medium text-sky-300 underline-offset-4 hover:text-sky-200 hover:underline"
              >
                Abrir login em nova tentativa
              </a>

              <p className="text-xs leading-relaxed text-slate-500">
                Se a tela não avançar automaticamente, toque em &quot;Continuar
                acesso&quot;.
              </p>

              {isWebView ? (
                <p className="text-xs leading-relaxed text-slate-500">
                  Se o acesso não continuar, abra no navegador do dispositivo.
                </p>
              ) : null}

              {startError ? (
                <p className="text-xs text-amber-300">
                  Não foi possível iniciar automaticamente. Use o botão acima.
                </p>
              ) : null}
            </div>
          ) : (
            <a
              href={destination}
              className="mt-8 inline-flex h-11 w-full items-center justify-center rounded-xl bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
            >
              Abrir Academy
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

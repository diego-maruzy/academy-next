"use client";

import type { ReactNode } from "react";

type OidcConnectingScreenProps = {
  title: string;
  description: string;
  showSpinner?: boolean;
  showActions?: boolean;
  actionLabel?: string;
  onContinue?: () => void;
  secondaryHref?: string;
  secondaryLabel?: string;
  hint?: string;
  webViewHint?: string;
  errorMessage?: string;
  extraActions?: ReactNode;
};

export function OidcConnectingScreen({
  title,
  description,
  showSpinner = true,
  showActions = false,
  actionLabel = "Continuar acesso",
  onContinue,
  secondaryHref,
  secondaryLabel = "Abrir login em nova tentativa",
  hint = 'Se a tela não avançar automaticamente, toque em "Continuar acesso".',
  webViewHint,
  errorMessage,
  extraActions,
}: OidcConnectingScreenProps) {
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

          {showSpinner ? (
            <div
              className="mx-auto mt-6 h-5 w-5 animate-spin rounded-full border-2 border-slate-600 border-t-sky-400"
              aria-hidden
            />
          ) : null}

          {showActions ? (
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={onContinue}
                className="h-11 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400"
              >
                {actionLabel}
              </button>

              {secondaryHref ? (
                <a
                  href={secondaryHref}
                  className="text-sm font-medium text-sky-300 underline-offset-4 hover:text-sky-200 hover:underline"
                >
                  {secondaryLabel}
                </a>
              ) : null}

              <p className="text-xs leading-relaxed text-slate-500">{hint}</p>

              {webViewHint ? (
                <p className="text-xs leading-relaxed text-slate-500">
                  {webViewHint}
                </p>
              ) : null}

              {extraActions}

              {errorMessage ? (
                <p className="text-xs text-amber-300">{errorMessage}</p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

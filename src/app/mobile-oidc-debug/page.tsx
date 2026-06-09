"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { isLikelyWebView } from "@/lib/auth/detect-webview";
import {
  parseHostTokensFromLocation,
  stripHostTokensFromUrl,
} from "@/lib/auth/oidc-session-client";
import { buildSafeTokenLog } from "@/lib/auth/token-inspect";

type DiagnoseResponse = {
  userAgent?: string;
  authorizationRule?: {
    allowedClients: string[];
    rule: string;
  };
  tokenPresence?: ReturnType<typeof buildSafeTokenLog>;
  validation?: {
    ok: boolean;
    code?: string;
    message?: string;
    clientId?: string;
    claims?: Record<string, unknown>;
    email?: string;
    sub?: string;
    roles?: string[];
    appRole?: string;
    details?: Record<string, unknown>;
  };
};

export default function MobileOidcDebugPage() {
  const [userAgent, setUserAgent] = useState("");
  const [sanitizedUrl, setSanitizedUrl] = useState("");
  const [cookiesEnabled, setCookiesEnabled] = useState<boolean | null>(null);
  const [localStorageEnabled, setLocalStorageEnabled] = useState<boolean | null>(
    null,
  );
  const [diagnose, setDiagnose] = useState<DiagnoseResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const isWebView = useMemo(() => isLikelyWebView(userAgent), [userAgent]);

  useEffect(() => {
    const ua = navigator.userAgent;
    setUserAgent(ua);

    const tokens = parseHostTokensFromLocation(window.location);
    const tokenLog = buildSafeTokenLog({
      accessToken: tokens?.access_token,
      idToken: tokens?.id_token,
      refreshToken: tokens?.refresh_token,
    });

    const clean = new URL(window.location.href);
    clean.searchParams.delete("access_token");
    clean.searchParams.delete("id_token");
    clean.searchParams.delete("refresh_token");
    setSanitizedUrl(`${clean.pathname}${clean.search}`);

    try {
      document.cookie = "cm_debug=1; path=/; SameSite=Lax";
      setCookiesEnabled(document.cookie.includes("cm_debug=1"));
    } catch {
      setCookiesEnabled(false);
    }

    try {
      localStorage.setItem("cm_debug", "1");
      setLocalStorageEnabled(localStorage.getItem("cm_debug") === "1");
      localStorage.removeItem("cm_debug");
    } catch {
      setLocalStorageEnabled(false);
    }

    void (async () => {
      if (!tokens?.access_token && !tokens?.id_token) {
        setLoading(false);
        return;
      }

      const response = await fetch("/api/oidc/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: tokens.access_token,
          id_token: tokens.id_token,
          refresh_token: tokens.refresh_token,
        }),
      });

      const payload = (await response.json()) as DiagnoseResponse;
      setDiagnose(payload);
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] px-4 py-8 text-sm text-slate-200">
      <div className="mx-auto max-w-3xl space-y-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Debug temporário
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            Mobile OIDC Debug
          </h1>
          <p className="mt-2 text-slate-400">
            Página temporária para diagnosticar Host SSO no WebView. Remover
            antes da produção final.
          </p>
        </div>

        <Section title="Ambiente">
          <Row label="WebView provável" value={isWebView ? "sim" : "não"} />
          <Row label="User-Agent" value={userAgent || "—"} />
          <Row label="URL atual (sem tokens)" value={sanitizedUrl || "—"} />
          <Row
            label="Cookies"
            value={
              cookiesEnabled === null ? "—" : cookiesEnabled ? "ok" : "bloqueado"
            }
          />
          <Row
            label="localStorage"
            value={
              localStorageEnabled === null
                ? "—"
                : localStorageEnabled
                  ? "ok"
                  : "bloqueado"
            }
          />
        </Section>

        <Section title="Tokens detectados">
          <Row
            label="access_token"
            value={
              diagnose?.tokenPresence?.hasAccessToken
                ? `sim (${diagnose.tokenPresence.accessTokenLength})`
                : "não"
            }
          />
          <Row
            label="id_token"
            value={
              diagnose?.tokenPresence?.hasIdToken
                ? `sim (${diagnose.tokenPresence.idTokenLength})`
                : "não"
            }
          />
          <Row
            label="refresh_token"
            value={
              diagnose?.tokenPresence?.hasRefreshToken
                ? `sim (${diagnose.tokenPresence.refreshTokenLength})`
                : "não"
            }
          />
          <Row
            label="access preview"
            value={diagnose?.tokenPresence?.accessTokenPreview ?? "—"}
          />
          <Row
            label="id preview"
            value={diagnose?.tokenPresence?.idTokenPreview ?? "—"}
          />
        </Section>

        <Section title="Validação">
          {loading ? (
            <p className="text-slate-400">Validando tokens...</p>
          ) : diagnose?.validation?.ok ? (
            <>
              <Row label="Status" value="ok" />
              <Row label="clientId" value={diagnose.validation.clientId ?? "—"} />
              <Row label="sub" value={diagnose.validation.sub ?? "—"} />
              <Row label="email" value={diagnose.validation.email ?? "—"} />
              <Row
                label="roles"
                value={diagnose.validation.roles?.join(", ") || "—"}
              />
              <Row label="appRole" value={diagnose.validation.appRole ?? "—"} />
            </>
          ) : (
            <>
              <Row label="Status" value="falhou" />
              <Row label="code" value={diagnose?.validation?.code ?? "sem_tokens"} />
              <Row label="message" value={diagnose?.validation?.message ?? "—"} />
            </>
          )}
        </Section>

        {diagnose?.tokenPresence?.idTokenClaims ? (
          <Section title="Claims id_token (decodificado)">
            <Row
              label="iss"
              value={diagnose.tokenPresence.idTokenClaims.iss ?? "—"}
            />
            <Row
              label="aud"
              value={String(diagnose.tokenPresence.idTokenClaims.aud ?? "—")}
            />
            <Row
              label="azp"
              value={diagnose.tokenPresence.idTokenClaims.azp ?? "—"}
            />
            <Row
              label="exp"
              value={String(diagnose.tokenPresence.idTokenClaims.exp ?? "—")}
            />
            <Row
              label="iat"
              value={String(diagnose.tokenPresence.idTokenClaims.iat ?? "—")}
            />
          </Section>
        ) : null}

        {diagnose?.tokenPresence?.accessTokenClaims ? (
          <Section title="Claims access_token (decodificado)">
            <Row
              label="iss"
              value={diagnose.tokenPresence.accessTokenClaims.iss ?? "—"}
            />
            <Row
              label="aud"
              value={String(diagnose.tokenPresence.accessTokenClaims.aud ?? "—")}
            />
            <Row
              label="azp"
              value={diagnose.tokenPresence.accessTokenClaims.azp ?? "—"}
            />
            <Row
              label="exp"
              value={String(diagnose.tokenPresence.accessTokenClaims.exp ?? "—")}
            />
          </Section>
        ) : null}

        {diagnose?.authorizationRule ? (
          <Section title="Regra de client autorizado">
            <Row label="rule" value={diagnose.authorizationRule.rule} />
            <Row
              label="allowedClients"
              value={diagnose.authorizationRule.allowedClients.join(", ") || "—"}
            />
          </Section>
        ) : null}

        <div className="flex flex-wrap gap-3 pt-2">
          <button
            type="button"
            onClick={() => window.location.assign("/oidc/login")}
            className="rounded-xl bg-blue-500 px-4 py-2 font-medium text-white"
          >
            Ir para /oidc/login
          </button>
          <button
            type="button"
            onClick={() => {
              stripHostTokensFromUrl();
              window.location.reload();
            }}
            className="rounded-xl border border-white/10 px-4 py-2 font-medium text-slate-200"
          >
            Limpar tokens da URL
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-sky-300">
        {title}
      </p>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid gap-1 border-b border-white/[0.06] pb-2 last:border-b-0 last:pb-0">
      <span className="text-xs uppercase tracking-[0.12em] text-slate-500">
        {label}
      </span>
      <span className="break-all text-slate-200">{value}</span>
    </div>
  );
}

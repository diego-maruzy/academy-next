"use client";

import type { OidcBridgeDebugState } from "@/lib/oidc/supabase-bridge";

type OidcBridgeDebugPanelProps = {
  debug: OidcBridgeDebugState;
};

function DebugRow({
  label,
  value,
}: {
  label: string;
  value: boolean | string | number;
}) {
  const display =
    typeof value === "boolean"
      ? value
        ? "true"
        : "false"
      : value === 0
        ? "0"
        : value || "—";

  return (
    <div className="flex items-center justify-between gap-3 text-left text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="font-mono text-amber-200">{display}</span>
    </div>
  );
}

export function OidcBridgeDebugPanel({ debug }: OidcBridgeDebugPanelProps) {
  return (
    <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/5 p-3 text-left">
      <p className="mb-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-amber-300">
        OIDC bridge debug
      </p>
      <div className="grid gap-1.5">
        <DebugRow label="oidc_user_ready" value={debug.oidc_user_ready} />
        <DebugRow label="provision_called" value={debug.provision_called} />
        <DebugRow label="provision_ok" value={debug.provision_ok} />
        <DebugRow label="bridge_called" value={debug.bridge_called} />
        <DebugRow label="bridge_ok" value={debug.bridge_ok} />
        <DebugRow label="has_token_hash" value={debug.has_token_hash} />
        <DebugRow label="verify_otp_ok" value={debug.verify_otp_ok} />
        <DebugRow
          label="verify_otp_has_session"
          value={debug.verify_otp_has_session}
        />
        <DebugRow label="set_session_ok" value={debug.set_session_ok} />
        <DebugRow
          label="supabase_session_persisted"
          value={debug.supabase_session_persisted}
        />
        <DebugRow label="redirect_started" value={debug.redirect_started} />
        <DebugRow label="last_step" value={debug.last_step ?? "—"} />
        <DebugRow label="last_error" value={debug.last_error ?? "—"} />
        <DebugRow
          label="status_code"
          value={debug.status_code ?? "—"}
        />
      </div>
    </div>
  );
}

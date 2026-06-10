"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { User } from "oidc-client-ts";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  extractAllRolesFromPayload,
  mapOidcRolesToAppRole,
} from "@/lib/oidc/roles";
import {
  decodeJwtPayload,
  extractEmailFromPayload,
} from "@/lib/oidc/jwt-utils";
import { notifyHostLoginSuccess } from "@/lib/embedded";

export type OidcBridgeDebugState = {
  oidc_user_ready: boolean;
  provision_called: boolean;
  bridge_called: boolean;
  bridge_ok: boolean;
  verify_otp_ok: boolean;
  supabase_session_persisted: boolean;
  redirect_started: boolean;
  last_error: string | null;
};

export type ProvisionResult =
  | { ok: true }
  | { ok: false; error: string; message?: string; debug?: Record<string, unknown> };

export type BridgeResult =
  | { ok: true; verify_otp_ok: boolean }
  | {
      ok: false;
      error: string;
      message?: string;
      debug?: Record<string, unknown>;
    };

export type ProvisionAndBridgeOptions = {
  debug?: boolean;
  source?: string;
  /** Ignora sessão existente e sempre chama provision + bridge. */
  force?: boolean;
};

export type ProvisionAndBridgeResult = {
  ok: boolean;
  code: string;
  message?: string;
  hasSession: boolean;
  provisionCalled: boolean;
  bridgeCalled: boolean;
  verifyOtpOk: boolean;
  debug: OidcBridgeDebugState;
};

function createInitialDebugState(): OidcBridgeDebugState {
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

function getIdentityFromUser(user: User) {
  const idPayload = user.id_token ? decodeJwtPayload(user.id_token) : null;
  const accessPayload = user.access_token
    ? decodeJwtPayload(user.access_token)
    : null;
  const profile =
    (user.profile as Record<string, unknown> | undefined) ??
    idPayload ??
    accessPayload;

  const email =
    extractEmailFromPayload(idPayload) ??
    extractEmailFromPayload(accessPayload) ??
    (typeof profile?.email === "string" ? profile.email : null);

  const sub =
    (typeof profile?.sub === "string" ? profile.sub : null) ??
    (typeof idPayload?.sub === "string" ? idPayload.sub : null) ??
    (typeof accessPayload?.sub === "string" ? accessPayload.sub : null);

  const name =
    (typeof profile?.name === "string" && profile.name) ||
    (typeof profile?.preferred_username === "string"
      ? profile.preferred_username
      : null) ||
    email ||
    "Checkmate User";

  const roles = [
    ...new Set([
      ...extractAllRolesFromPayload(idPayload),
      ...extractAllRolesFromPayload(accessPayload),
      ...(Array.isArray(profile?.roles)
        ? profile.roles.filter((role): role is string => typeof role === "string")
        : []),
    ]),
  ];

  return {
    sub,
    email,
    name,
    roles,
    appRole: mapOidcRolesToAppRole(roles),
  };
}

export function getSbLocalStorageKeys() {
  if (typeof window === "undefined") {
    return [];
  }

  return Object.keys(localStorage).filter((key) => key.startsWith("sb-"));
}

export function hasSbAuthTokenInLocalStorage() {
  const sbKeys = getSbLocalStorageKeys();

  return sbKeys.some((key) => {
    if (!key.includes("auth-token")) {
      return false;
    }

    const raw = localStorage.getItem(key);

    if (!raw) {
      return false;
    }

    try {
      const parsed = JSON.parse(raw) as { access_token?: string } | null;
      return Boolean(parsed?.access_token);
    } catch {
      return raw.length > 0;
    }
  });
}

async function logSupabaseSessionState(
  supabase: SupabaseClient,
  step = "supabase_get_session",
) {
  const sbKeys = getSbLocalStorageKeys();
  const { data: sessionData } = await supabase.auth.getSession();

  console.info("[OIDC]", {
    step,
    hasSession: Boolean(sessionData.session),
    hasSbToken: sbKeys.some((key) => key.includes("auth-token")),
    sbKeyCount: sbKeys.length,
  });

  return {
    hasSession: Boolean(sessionData.session),
    hasSbToken: sbKeys.some((key) => key.includes("auth-token")),
    sbKeyCount: sbKeys.length,
    session: sessionData.session,
  };
}

async function waitForPersistedSession(supabase: SupabaseClient) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 100);
  });

  return logSupabaseSessionState(supabase, "supabase_get_session");
}

async function persistSessionFromVerifyOtp(
  supabase: SupabaseClient,
  session: Session | null,
) {
  if (!session?.access_token || !session.refresh_token) {
    return {
      ok: false as const,
      error: "verify_otp_no_session_returned" as const,
      debug: {
        verifyOtpOk: true,
        verifyOtpHasSession: Boolean(session),
        verifyOtpHasRefreshToken: Boolean(session?.refresh_token),
      },
    };
  }

  const setResult = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  console.info("[OIDC]", {
    step: "supabase_set_session_result",
    ok: !setResult.error,
    hasSession: Boolean(setResult.data.session),
    errorMessage: setResult.error?.message,
    errorStatus: setResult.error?.status,
  });

  if (setResult.error) {
    return {
      ok: false as const,
      error: "supabase_set_session_failed" as const,
      message: setResult.error.message,
      debug: {
        verifyOtpHasSession: true,
        setSessionOk: false,
        errorMessage: setResult.error.message,
        errorStatus: setResult.error.status,
      },
    };
  }

  const firstCheck = await logSupabaseSessionState(
    supabase,
    "supabase_get_session",
  );

  if (firstCheck.hasSession && firstCheck.hasSbToken) {
    return { ok: true as const };
  }

  const secondCheck = await waitForPersistedSession(supabase);

  if (secondCheck.hasSession && secondCheck.hasSbToken) {
    return { ok: true as const };
  }

  return {
    ok: false as const,
    error: "supabase_session_not_persisted" as const,
    debug: {
      verifyOtpHasSession: true,
      setSessionOk: true,
      getSessionHasSession: secondCheck.hasSession,
      hasSbToken: secondCheck.hasSbToken,
      sbKeyCount: secondCheck.sbKeyCount,
    },
  };
}

async function verifyOtpWithPersistence(
  supabase: SupabaseClient,
  tokenHash: string,
): Promise<BridgeResult> {
  const tryVerify = async (type: "magiclink" | "email") => {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });

    return { data, error, type };
  };

  let attempt = await tryVerify("magiclink");

  if (attempt.error) {
    attempt = await tryVerify("email");
  }

  const { data, error } = attempt;

  console.info("[OIDC]", {
    step: "verify_otp_result",
    ok: !error,
    hasSession: Boolean(data?.session),
    hasUser: Boolean(data?.user),
    errorMessage: error?.message,
    errorStatus: error?.status,
  });

  if (error) {
    return {
      ok: false,
      error: "verify_otp_failed",
      message: error.message,
      debug: {
        code: "verify_otp_failed",
        message: error.message,
        status: error.status,
        name: error.name,
      },
    };
  }

  if (!data?.session) {
    return {
      ok: false,
      error: "verify_otp_no_session_returned",
      message: "verifyOtp concluiu sem retornar sessão.",
      debug: {
        verifyOtpOk: true,
        verifyOtpHasSession: false,
        verifyOtpHasUser: Boolean(data?.user),
      },
    };
  }

  const persisted = await persistSessionFromVerifyOtp(supabase, data.session);

  if (!persisted.ok) {
    return {
      ok: false,
      error: persisted.error,
      message: persisted.message,
      debug: persisted.debug,
    };
  }

  return { ok: true, verify_otp_ok: true };
}

export async function hasSupabaseBrowserSession() {
  if (!hasSbAuthTokenInLocalStorage()) {
    return false;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase.auth.getSession();
    return Boolean(data.session);
  } catch {
    return false;
  }
}

export async function provisionOidcUser(user: User): Promise<ProvisionResult> {
  const identity = getIdentityFromUser(user);

  if (!identity.email || !identity.sub) {
    return {
      ok: false,
      error: "missing_identity",
      message: "Usuário OIDC sem email ou sub.",
    };
  }

  const response = await fetch("/api/oidc/provision", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      sub: identity.sub,
      email: identity.email,
      name: identity.name,
      roles: identity.roles,
      appRole: identity.appRole,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        error?: string;
        message?: string;
        step?: string;
        supabaseErrorCode?: string;
        supabaseErrorMessage?: string;
      }
    | null;

  if (!response.ok || !payload?.ok) {
    return {
      ok: false,
      error: payload?.error ?? "provision_failed",
      message: payload?.supabaseErrorMessage ?? payload?.message,
      debug: {
        step: payload?.step,
        supabaseErrorCode: payload?.supabaseErrorCode,
      },
    };
  }

  return { ok: true };
}

export async function bridgeSupabaseSession(
  user: User,
): Promise<BridgeResult> {
  const identity = getIdentityFromUser(user);

  if (!identity.email || !identity.sub) {
    return {
      ok: false,
      error: "missing_identity",
      message: "Email ou sub ausente para bridge Supabase.",
    };
  }

  const response = await fetch("/api/oidc/supabase-bridge", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      email: identity.email,
      sub: identity.sub,
      name: identity.name,
      roles: identity.roles,
      appRole: identity.appRole,
    }),
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        token_hash?: string;
        code?: string;
        step?: string;
        message?: string;
        supabaseErrorCode?: string;
        supabaseErrorMessage?: string;
        hasServiceRoleKey?: boolean;
        hasSupabaseUrl?: boolean;
        emailPresent?: boolean;
        subPresent?: boolean;
      }
    | null;

  const hasTokenHash = Boolean(payload?.token_hash);

  console.info("[OIDC]", {
    step: "supabase_bridge_response",
    ok: Boolean(response.ok && payload?.ok),
    hasTokenHash,
  });

  if (!response.ok || !payload?.ok || !payload.token_hash) {
    console.info("[OIDC]", {
      step: "supabase_bridge_failed",
      code: payload?.code,
      bridgeStep: payload?.step,
      hasServiceRoleKey: payload?.hasServiceRoleKey,
      hasSupabaseUrl: payload?.hasSupabaseUrl,
      emailPresent: payload?.emailPresent,
      subPresent: payload?.subPresent,
      supabaseErrorCode: payload?.supabaseErrorCode,
      supabaseErrorMessage: payload?.supabaseErrorMessage,
    });

    return {
      ok: false,
      error: payload?.code ?? "supabase_bridge_failed",
      message: payload?.supabaseErrorMessage ?? payload?.message,
      debug: {
        step: payload?.step,
        hasServiceRoleKey: payload?.hasServiceRoleKey,
        hasSupabaseUrl: payload?.hasSupabaseUrl,
        supabaseErrorCode: payload?.supabaseErrorCode,
        hasTokenHash,
      },
    };
  }

  const supabase = createSupabaseBrowserClient();
  return verifyOtpWithPersistence(supabase, payload.token_hash);
}

function toBridgeResult(
  ok: boolean,
  code: string,
  debug: OidcBridgeDebugState,
  extra?: Partial<ProvisionAndBridgeResult>,
): ProvisionAndBridgeResult {
  return {
    ok,
    code,
    hasSession: debug.supabase_session_persisted,
    provisionCalled: debug.provision_called,
    bridgeCalled: debug.bridge_called,
    verifyOtpOk: debug.verify_otp_ok,
    debug,
    ...extra,
  };
}

export async function provisionAndBridgeSupabase(
  user: User,
  options?: ProvisionAndBridgeOptions,
): Promise<ProvisionAndBridgeResult> {
  const debug = createInitialDebugState();

  if (options?.source) {
    console.info("[OIDC]", {
      step: "supabase_bridge_start",
      source: options.source,
    });
  } else {
    console.info("[OIDC]", { step: "supabase_bridge_start" });
  }

  debug.oidc_user_ready = Boolean(user && !user.expired);
  console.info("[OIDC]", {
    step: "oidc_user_ready",
    ok: debug.oidc_user_ready,
  });

  if (!debug.oidc_user_ready) {
    debug.last_error = "oidc_user_invalid";
    return toBridgeResult(false, "oidc_user_invalid", debug, {
      message: "Usuário OIDC inválido ou expirado.",
    });
  }

  const hasPersistedSbToken = hasSbAuthTokenInLocalStorage();

  if (!options?.force && hasPersistedSbToken) {
    const supabase = createSupabaseBrowserClient();
    const sessionState = await logSupabaseSessionState(
      supabase,
      "supabase_get_session",
    );

    debug.supabase_session_persisted = sessionState.hasSession;
    debug.bridge_ok = sessionState.hasSession;
    debug.verify_otp_ok = sessionState.hasSession;

    if (sessionState.hasSession) {
      return toBridgeResult(true, "ok", debug);
    }
  }

  console.info("[OIDC]", { step: "provision_start" });
  debug.provision_called = true;

  const provision = await provisionOidcUser(user);
  console.info("[OIDC]", { step: "provision_response", ok: provision.ok });

  if (!provision.ok) {
    debug.last_error = provision.error;
    return toBridgeResult(false, provision.error, debug, {
      message: provision.message,
    });
  }

  debug.bridge_called = true;
  const bridge = await bridgeSupabaseSession(user);
  debug.bridge_ok = bridge.ok;
  debug.verify_otp_ok = bridge.ok ? bridge.verify_otp_ok : false;

  if (!bridge.ok) {
    debug.last_error = bridge.error;
    return toBridgeResult(false, bridge.error, debug, {
      message: bridge.message,
    });
  }

  const supabase = createSupabaseBrowserClient();
  const sessionState = await waitForPersistedSession(supabase);
  debug.supabase_session_persisted =
    sessionState.hasSession && sessionState.hasSbToken;

  if (!debug.supabase_session_persisted) {
    debug.last_error = "supabase_session_not_persisted";
    return toBridgeResult(false, "supabase_session_not_persisted", debug, {
      message: "Sessão Supabase não foi persistida no browser.",
    });
  }

  const identity = getIdentityFromUser(user);
  notifyHostLoginSuccess({
    email: identity.email ?? undefined,
    sub: identity.sub ?? undefined,
  });

  return toBridgeResult(true, "ok", debug);
}

/** @deprecated Use provisionAndBridgeSupabase */
export async function completeOidcPostLogin(user: User) {
  return provisionAndBridgeSupabase(user);
}

/** Auth.js secundário — não bloqueia o fluxo mobile. */
export function syncAuthJsSessionInBackground(user: User) {
  void fetch("/api/oidc/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      id_token: user.id_token,
      access_token: user.access_token,
      auth_source: "host-tokens",
    }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { error?: string }
          | null;

        console.warn("[oidc] Auth.js background sync skipped:", {
          status: response.status,
          error: payload?.error ?? "session_sync_failed",
        });
      }
    })
    .catch(() => {
      console.warn(
        "[oidc] Auth.js background sync unavailable; OIDC/Supabase remain primary.",
      );
    });
}

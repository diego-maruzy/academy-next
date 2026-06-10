"use client";

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import type { User } from "oidc-client-ts";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  BridgeTimeoutError,
  fetchWithBridgeTimeout,
  isBridgeTimeoutError,
  OIDC_BRIDGE_OVERALL_TIMEOUT_MS,
  withBridgeTimeout,
  type BridgeTimeoutStep,
} from "@/lib/oidc/bridge-timeout";
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
  provision_ok: boolean;
  bridge_called: boolean;
  bridge_ok: boolean;
  has_token_hash: boolean;
  verify_otp_ok: boolean;
  verify_otp_has_session: boolean;
  set_session_ok: boolean;
  supabase_session_persisted: boolean;
  redirect_started: boolean;
  last_step: string | null;
  last_error: string | null;
  status_code: number | null;
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
  force?: boolean;
  onDebugUpdate?: (debug: OidcBridgeDebugState) => void;
};

export type ProvisionAndBridgeResult = {
  ok: boolean;
  code: string;
  step?: BridgeTimeoutStep | "overall";
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
    provision_ok: false,
    bridge_called: false,
    bridge_ok: false,
    has_token_hash: false,
    verify_otp_ok: false,
    verify_otp_has_session: false,
    set_session_ok: false,
    supabase_session_persisted: false,
    redirect_started: false,
    last_step: null,
    last_error: null,
    status_code: null,
  };
}

function patchDebug(
  debug: OidcBridgeDebugState,
  patch: Partial<OidcBridgeDebugState>,
  onDebugUpdate?: (debug: OidcBridgeDebugState) => void,
) {
  Object.assign(debug, patch);
  onDebugUpdate?.({ ...debug });
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
  debug: OidcBridgeDebugState,
  onDebugUpdate?: (debug: OidcBridgeDebugState) => void,
  step = "get_session",
) {
  patchDebug(debug, { last_step: step }, onDebugUpdate);

  const sbKeys = getSbLocalStorageKeys();
  const { data: sessionData } = await withBridgeTimeout(
    "get_session",
    supabase.auth.getSession(),
  );

  const hasSession = Boolean(sessionData.session);
  const hasSbToken = sbKeys.some((key) => key.includes("auth-token"));

  console.info("[OIDC]", {
    step: "supabase_get_session",
    hasSession,
    hasSbToken,
    sbKeyCount: sbKeys.length,
  });

  patchDebug(
    debug,
    {
      supabase_session_persisted: hasSession && hasSbToken,
    },
    onDebugUpdate,
  );

  return {
    hasSession,
    hasSbToken,
    sbKeyCount: sbKeys.length,
    session: sessionData.session,
  };
}

async function waitForPersistedSession(
  supabase: SupabaseClient,
  debug: OidcBridgeDebugState,
  onDebugUpdate?: (debug: OidcBridgeDebugState) => void,
) {
  await new Promise((resolve) => {
    window.setTimeout(resolve, 100);
  });

  return logSupabaseSessionState(supabase, debug, onDebugUpdate, "get_session");
}

async function persistSessionFromVerifyOtp(
  supabase: SupabaseClient,
  session: Session | null,
  debug: OidcBridgeDebugState,
  onDebugUpdate?: (debug: OidcBridgeDebugState) => void,
) {
  patchDebug(debug, { last_step: "set_session" }, onDebugUpdate);

  if (!session?.access_token || !session.refresh_token) {
    patchDebug(
      debug,
      {
        verify_otp_has_session: Boolean(session),
        last_error: "verify_otp_no_session_returned",
      },
      onDebugUpdate,
    );

    return {
      ok: false as const,
      error: "verify_otp_no_session_returned" as const,
      debug: {
        verifyOtpOk: true,
        verifyOtpHasSession: false,
        verifyOtpHasRefreshToken: Boolean(session?.refresh_token),
      },
    };
  }

  const setResult = await withBridgeTimeout(
    "set_session",
    supabase.auth.setSession({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
    }),
  );

  const setSessionOk = !setResult.error;

  console.info("[OIDC]", {
    step: "supabase_set_session_result",
    ok: setSessionOk,
    hasSession: Boolean(setResult.data.session),
    errorMessage: setResult.error?.message,
    errorStatus: setResult.error?.status,
  });

  patchDebug(
    debug,
    {
      set_session_ok: setSessionOk,
      verify_otp_has_session: true,
      status_code: setResult.error?.status ?? debug.status_code,
      last_error: setResult.error ? "supabase_set_session_failed" : null,
    },
    onDebugUpdate,
  );

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
    debug,
    onDebugUpdate,
    "get_session",
  );

  if (firstCheck.hasSession && firstCheck.hasSbToken) {
    return { ok: true as const };
  }

  const secondCheck = await waitForPersistedSession(
    supabase,
    debug,
    onDebugUpdate,
  );

  if (secondCheck.hasSession && secondCheck.hasSbToken) {
    return { ok: true as const };
  }

  patchDebug(
    debug,
    {
      last_error: "supabase_session_not_persisted",
    },
    onDebugUpdate,
  );

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
  debug: OidcBridgeDebugState,
  onDebugUpdate?: (debug: OidcBridgeDebugState) => void,
): Promise<BridgeResult> {
  patchDebug(debug, { last_step: "verify_otp" }, onDebugUpdate);

  const tryVerify = async (type: "magiclink" | "email") =>
    withBridgeTimeout(
      "verify_otp",
      supabase.auth.verifyOtp({
        type,
        token_hash: tokenHash,
      }),
    );

  let attempt = await tryVerify("magiclink");

  if (attempt.error) {
    attempt = await tryVerify("email");
  }

  const { data, error } = attempt;
  const verifyOtpOk = !error;

  console.info("[OIDC]", {
    step: "verify_otp_result",
    ok: verifyOtpOk,
    hasSession: Boolean(data?.session),
    hasUser: Boolean(data?.user),
    errorMessage: error?.message,
    errorStatus: error?.status,
  });

  patchDebug(
    debug,
    {
      verify_otp_ok: verifyOtpOk,
      verify_otp_has_session: Boolean(data?.session),
      status_code: error?.status ?? debug.status_code,
      last_error: error ? "verify_otp_failed" : null,
    },
    onDebugUpdate,
  );

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
    patchDebug(
      debug,
      { last_error: "verify_otp_no_session_returned" },
      onDebugUpdate,
    );

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

  const persisted = await persistSessionFromVerifyOtp(
    supabase,
    data.session,
    debug,
    onDebugUpdate,
  );

  if (!persisted.ok) {
    return {
      ok: false,
      error: persisted.error,
      message: persisted.message,
      debug: persisted.debug,
    };
  }

  patchDebug(debug, { bridge_ok: true }, onDebugUpdate);
  return { ok: true, verify_otp_ok: true };
}

export async function hasSupabaseBrowserSession() {
  if (!hasSbAuthTokenInLocalStorage()) {
    return false;
  }

  try {
    const supabase = createSupabaseBrowserClient();
    const { data } = await withBridgeTimeout(
      "get_session",
      supabase.auth.getSession(),
    );
    return Boolean(data.session);
  } catch {
    return false;
  }
}

export async function provisionOidcUser(
  user: User,
  debug?: OidcBridgeDebugState,
  onDebugUpdate?: (debug: OidcBridgeDebugState) => void,
): Promise<ProvisionResult> {
  const identity = getIdentityFromUser(user);

  if (!identity.email || !identity.sub) {
    return {
      ok: false,
      error: "missing_identity",
      message: "Usuário OIDC sem email ou sub.",
    };
  }

  if (debug) {
    patchDebug(debug, { last_step: "provision" }, onDebugUpdate);
  }

  try {
    const response = await fetchWithBridgeTimeout(
      "/api/oidc/provision",
      {
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
      },
      "provision",
    );

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

    if (debug) {
      patchDebug(
        debug,
        {
          provision_ok: response.ok && Boolean(payload?.ok),
          status_code: response.status,
          last_error:
            response.ok && payload?.ok
              ? null
              : (payload?.error ?? "provision_failed"),
        },
        onDebugUpdate,
      );
    }

    if (!response.ok || !payload?.ok) {
      return {
        ok: false,
        error: payload?.error ?? "provision_failed",
        message: payload?.supabaseErrorMessage ?? payload?.message,
        debug: {
          step: payload?.step,
          supabaseErrorCode: payload?.supabaseErrorCode,
          status: response.status,
        },
      };
    }

    return { ok: true };
  } catch (error) {
    if (isBridgeTimeoutError(error)) {
      if (debug) {
        patchDebug(
          debug,
          {
            last_step: error.step,
            last_error: error.code,
          },
          onDebugUpdate,
        );
      }

      return {
        ok: false,
        error: error.code,
        debug: { step: error.step },
      };
    }

    throw error;
  }
}

export async function bridgeSupabaseSession(
  user: User,
  debug?: OidcBridgeDebugState,
  onDebugUpdate?: (debug: OidcBridgeDebugState) => void,
): Promise<BridgeResult> {
  const identity = getIdentityFromUser(user);

  if (!identity.email || !identity.sub) {
    return {
      ok: false,
      error: "missing_identity",
      message: "Email ou sub ausente para bridge Supabase.",
    };
  }

  if (debug) {
    patchDebug(debug, { last_step: "bridge" }, onDebugUpdate);
  }

  try {
    const response = await fetchWithBridgeTimeout(
      "/api/oidc/supabase-bridge",
      {
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
      },
      "bridge",
    );

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

    if (debug) {
      patchDebug(
        debug,
        {
          has_token_hash: hasTokenHash,
          status_code: response.status,
        },
        onDebugUpdate,
      );
    }

    if (!response.ok || !payload?.ok || !payload.token_hash) {
      if (debug) {
        patchDebug(
          debug,
          {
            bridge_ok: false,
            last_error: payload?.code ?? "supabase_bridge_failed",
          },
          onDebugUpdate,
        );
      }

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
          status: response.status,
        },
      };
    }

    const supabase = createSupabaseBrowserClient();
    return verifyOtpWithPersistence(
      supabase,
      payload.token_hash,
      debug ?? createInitialDebugState(),
      onDebugUpdate,
    );
  } catch (error) {
    if (isBridgeTimeoutError(error)) {
      if (debug) {
        patchDebug(
          debug,
          {
            last_step: error.step,
            last_error: error.code,
          },
          onDebugUpdate,
        );
      }

      return {
        ok: false,
        error: error.code,
        debug: { step: error.step },
      };
    }

    throw error;
  }
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

function buildTimeoutResult(
  step: BridgeTimeoutStep | "overall",
  debug: OidcBridgeDebugState,
): ProvisionAndBridgeResult {
  patchDebug(debug, {
    last_step: step,
    last_error: "supabase_bridge_timeout",
  });

  return toBridgeResult(false, "supabase_bridge_timeout", debug, {
    step,
    message: "Não foi possível criar sua sessão Supabase.",
  });
}

export async function provisionAndBridgeSupabase(
  user: User,
  options?: ProvisionAndBridgeOptions,
): Promise<ProvisionAndBridgeResult> {
  const debug = createInitialDebugState();
  const onDebugUpdate = options?.onDebugUpdate;

  if (options?.source) {
    console.info("[OIDC]", {
      step: "supabase_bridge_start",
      source: options.source,
    });
  } else {
    console.info("[OIDC]", { step: "supabase_bridge_start" });
  }

  debug.oidc_user_ready = Boolean(user && !user.expired);
  patchDebug(debug, { oidc_user_ready: debug.oidc_user_ready }, onDebugUpdate);

  console.info("[OIDC]", {
    step: "oidc_user_ready",
    ok: debug.oidc_user_ready,
  });

  if (!debug.oidc_user_ready) {
    return toBridgeResult(false, "oidc_user_invalid", debug, {
      message: "Usuário OIDC inválido ou expirado.",
    });
  }

  const hasPersistedSbToken = hasSbAuthTokenInLocalStorage();

  if (!options?.force && hasPersistedSbToken) {
    try {
      const supabase = createSupabaseBrowserClient();
      const sessionState = await logSupabaseSessionState(
        supabase,
        debug,
        onDebugUpdate,
        "get_session",
      );

      debug.bridge_ok = sessionState.hasSession;
      debug.verify_otp_ok = sessionState.hasSession;

      if (sessionState.hasSession && sessionState.hasSbToken) {
        return toBridgeResult(true, "ok", debug);
      }
    } catch (error) {
      if (isBridgeTimeoutError(error)) {
        return buildTimeoutResult(error.step, debug);
      }

      throw error;
    }
  }

  try {
    console.info("[OIDC]", { step: "provision_start" });
    patchDebug(debug, { provision_called: true }, onDebugUpdate);

    const provision = await provisionOidcUser(user, debug, onDebugUpdate);
    console.info("[OIDC]", { step: "provision_response", ok: provision.ok });

    if (!provision.ok) {
      const code =
        provision.error === "supabase_bridge_timeout"
          ? "supabase_bridge_timeout"
          : provision.error;

      if (code === "supabase_bridge_timeout") {
        return buildTimeoutResult("provision", debug);
      }

      return toBridgeResult(false, code, debug, {
        message: provision.message,
        step: provision.debug?.step as BridgeTimeoutStep | undefined,
      });
    }

    patchDebug(debug, { provision_ok: true }, onDebugUpdate);
    patchDebug(debug, { bridge_called: true }, onDebugUpdate);

    const bridge = await bridgeSupabaseSession(user, debug, onDebugUpdate);
    debug.bridge_ok = bridge.ok;
    debug.verify_otp_ok = bridge.ok ? bridge.verify_otp_ok : false;
    onDebugUpdate?.({ ...debug });

    if (!bridge.ok) {
      const code =
        bridge.error === "supabase_bridge_timeout"
          ? "supabase_bridge_timeout"
          : bridge.error;

      if (code === "supabase_bridge_timeout") {
        const step =
          (bridge.debug?.step as BridgeTimeoutStep | undefined) ?? "bridge";
        return buildTimeoutResult(step, debug);
      }

      return toBridgeResult(false, code, debug, {
        message: bridge.message,
      });
    }

    const supabase = createSupabaseBrowserClient();
    const sessionState = await waitForPersistedSession(
      supabase,
      debug,
      onDebugUpdate,
    );

    debug.supabase_session_persisted =
      sessionState.hasSession && sessionState.hasSbToken;

    if (!debug.supabase_session_persisted) {
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
  } catch (error) {
    if (isBridgeTimeoutError(error)) {
      return buildTimeoutResult(error.step, debug);
    }

    const message = error instanceof Error ? error.message : "unknown_error";
    patchDebug(debug, { last_error: message }, onDebugUpdate);

    return toBridgeResult(false, "supabase_bridge_failed", debug, {
      message,
    });
  }
}

export async function provisionAndBridgeSupabaseWithTimeout(
  user: User,
  options?: ProvisionAndBridgeOptions,
): Promise<ProvisionAndBridgeResult> {
  let latestDebug = createInitialDebugState();

  const result = await Promise.race([
    provisionAndBridgeSupabase(user, {
      ...options,
      onDebugUpdate: (debug) => {
        latestDebug = { ...debug };
        options?.onDebugUpdate?.(debug);
      },
    }),
    new Promise<null>((resolve) => {
      window.setTimeout(() => resolve(null), OIDC_BRIDGE_OVERALL_TIMEOUT_MS);
    }),
  ]);

  if (result === null) {
    return buildTimeoutResult(
      (latestDebug.last_step as BridgeTimeoutStep | null) ?? "overall",
      latestDebug,
    );
  }

  return result;
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

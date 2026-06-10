export type BridgeTimeoutStep =
  | "provision"
  | "bridge"
  | "verify_otp"
  | "set_session"
  | "get_session";

export const BRIDGE_STEP_TIMEOUT_MS: Record<BridgeTimeoutStep, number> = {
  provision: 10_000,
  bridge: 10_000,
  verify_otp: 10_000,
  set_session: 10_000,
  get_session: 5_000,
};

export const OIDC_BRIDGE_OVERALL_TIMEOUT_MS = 30_000;

export class BridgeTimeoutError extends Error {
  readonly code = "supabase_bridge_timeout" as const;
  readonly step: BridgeTimeoutStep;

  constructor(step: BridgeTimeoutStep) {
    super(`OIDC bridge step timed out: ${step}`);
    this.name = "BridgeTimeoutError";
    this.step = step;
  }
}

export function isBridgeTimeoutError(
  error: unknown,
): error is BridgeTimeoutError {
  return error instanceof BridgeTimeoutError;
}

export async function withBridgeTimeout<T>(
  step: BridgeTimeoutStep,
  promise: Promise<T>,
  timeoutMs = BRIDGE_STEP_TIMEOUT_MS[step],
): Promise<T> {
  let timeoutId: number | undefined;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timeoutId = window.setTimeout(() => {
          reject(new BridgeTimeoutError(step));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId !== undefined) {
      window.clearTimeout(timeoutId);
    }
  }
}

export async function fetchWithBridgeTimeout(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  step: Extract<BridgeTimeoutStep, "provision" | "bridge">,
) {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, BRIDGE_STEP_TIMEOUT_MS[step]);

  try {
    return await fetch(input, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) {
      throw new BridgeTimeoutError(step);
    }

    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

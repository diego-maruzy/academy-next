"use client";

import { useEffect, useRef } from "react";
import { getUser } from "@/lib/oidc/auth-service";
import {
  hasSupabaseBrowserSession,
  provisionAndBridgeSupabaseWithTimeout,
} from "@/lib/oidc/supabase-bridge";

/**
 * Safety net: se o host redirecionar cedo para /dashboard com OIDC no
 * localStorage mas sem sessão Supabase, completa o bridge aqui.
 */
export function OidcSupabaseSessionSync() {
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    void (async () => {
      const hasSupabase = await hasSupabaseBrowserSession();

      if (hasSupabase) {
        return;
      }

      const user = await getUser();

      if (!user || user.expired) {
        return;
      }

      console.info("[OIDC]", {
        step: "dashboard_supabase_bridge_recovery_start",
      });

      const result = await provisionAndBridgeSupabaseWithTimeout(user, {
        source: "dashboard-recovery",
        force: true,
      });

      if (!result.ok) {
        console.info("[OIDC]", {
          step: "dashboard_supabase_bridge_recovery_failed",
          error: result.code,
        });
      }
    })();
  }, []);

  return null;
}

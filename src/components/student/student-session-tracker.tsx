"use client";

/**
 * Mede tempo na plataforma via session_heartbeat.
 * Quando Keycloak estiver ativo, clientId virá da sessão do aluno autenticado.
 */

import { useEffect, useRef } from "react";
import { recordStudentActivityAction } from "@/lib/actions/student-activity-actions";

const HEARTBEAT_INTERVAL_MS = 60_000;
const HEARTBEAT_DURATION_SECONDS = 60;

type StudentSessionTrackerProps = {
  clientId: string | null;
};

export function StudentSessionTracker({ clientId }: StudentSessionTrackerProps) {
  const visibleRef = useRef(
    typeof document !== "undefined"
      ? document.visibilityState === "visible"
      : true,
  );

  useEffect(() => {
    if (!clientId) {
      return;
    }

    function handleVisibilityChange() {
      visibleRef.current = document.visibilityState === "visible";
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    const interval = window.setInterval(() => {
      if (!visibleRef.current) {
        return;
      }

      void recordStudentActivityAction({
        clientId,
        eventType: "session_heartbeat",
        durationSeconds: HEARTBEAT_DURATION_SECONDS,
      });
    }, HEARTBEAT_INTERVAL_MS);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.clearInterval(interval);
    };
  }, [clientId]);

  return null;
}

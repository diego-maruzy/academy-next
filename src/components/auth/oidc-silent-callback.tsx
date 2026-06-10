"use client";

import { useEffect } from "react";
import { handleSilentCallback } from "@/lib/oidc/auth-service";

export function OidcSilentCallback() {
  useEffect(() => {
    void handleSilentCallback().catch(() => {
      // Silent renew failures are non-blocking for the main login flow.
    });
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-transparent" aria-hidden>
      .
    </div>
  );
}

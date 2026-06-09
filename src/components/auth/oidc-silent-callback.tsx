"use client";

import { useEffect } from "react";
import { getOidcUserManager } from "@/lib/auth/oidc-user-manager";

export function OidcSilentCallback() {
  useEffect(() => {
    void getOidcUserManager()
      .signinSilentCallback()
      .catch(() => {
        // Silent renew failures are non-blocking for the main login flow.
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0f172a] text-transparent" aria-hidden>
      .
    </div>
  );
}

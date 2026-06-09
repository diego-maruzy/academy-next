"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type KeycloakLoginButtonProps = {
  callbackUrl?: string;
  label?: string;
};

export function KeycloakLoginButton({
  callbackUrl = "/dashboard",
  label = "Entrar com Checkmate",
}: KeycloakLoginButtonProps) {
  const [pending, setPending] = useState(false);

  async function handleLogin() {
    setPending(true);

    try {
      const result = await signIn("keycloak", { callbackUrl, redirect: false });

      if (result?.url) {
        window.location.href = result.url;
        return;
      }
    } catch {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleLogin()}
      disabled={pending}
      className="h-12 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Redirecionando..." : label}
    </button>
  );
}

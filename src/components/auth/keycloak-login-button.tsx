"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

type KeycloakLoginButtonProps = {
  callbackUrl?: string;
};

export function KeycloakLoginButton({
  callbackUrl = "/dashboard",
}: KeycloakLoginButtonProps) {
  const [pending, setPending] = useState(false);

  function handleLogin() {
    setPending(true);
    void signIn("keycloak", { callbackUrl });
  }

  return (
    <button
      type="button"
      onClick={handleLogin}
      disabled={pending}
      className="h-12 w-full rounded-xl bg-blue-500 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Redirecionando..." : "Entrar com Checkmate"}
    </button>
  );
}

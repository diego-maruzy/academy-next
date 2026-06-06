"use client";

import { createContext, useContext } from "react";
import type { CurrentUser } from "@/lib/auth/current-user";

const UserContext = createContext<CurrentUser | null>(null);

type UserProviderProps = {
  user: CurrentUser;
  children: React.ReactNode;
};

export function UserProvider({ user, children }: UserProviderProps) {
  return <UserContext.Provider value={user}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): CurrentUser {
  const user = useContext(UserContext);

  if (!user) {
    throw new Error("useCurrentUser deve ser usado dentro de UserProvider.");
  }

  return user;
}

"use client";

import { createContext, useContext } from "react";
import type { CurrentAdmin } from "@/lib/admin-auth/current-admin";

const AdminContext = createContext<CurrentAdmin | null>(null);

type AdminProviderProps = {
  admin: CurrentAdmin;
  children: React.ReactNode;
};

export function AdminProvider({ admin, children }: AdminProviderProps) {
  return (
    <AdminContext.Provider value={admin}>{children}</AdminContext.Provider>
  );
}

export function useCurrentAdmin(): CurrentAdmin {
  const admin = useContext(AdminContext);

  if (!admin) {
    throw new Error("useCurrentAdmin deve ser usado dentro de AdminProvider.");
  }

  return admin;
}

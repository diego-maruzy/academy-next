const CLIENT_ROLE_LABELS: Record<string, string> = {
  ROLE_USER_FREE: "Free",
  ROLE_USER: "Premium",
  user: "Usuário",
  admin: "Admin",
  ROLE_ADMIN: "Admin",
  academy_access: "Academy",
  property_access: "Property",
};

export function formatClientRole(role: string | null | undefined): string {
  if (!role) {
    return "Usuário";
  }

  const normalized = role.trim();
  const upper = normalized.toUpperCase();

  return (
    CLIENT_ROLE_LABELS[normalized] ??
    CLIENT_ROLE_LABELS[upper] ??
    normalized.replace(/^ROLE_/i, "").replaceAll("_", " ")
  );
}

export function isPremiumRole(role: string | null | undefined): boolean {
  const upper = role?.trim().toUpperCase() ?? "";
  return upper === "ROLE_USER" || upper === "ADMIN" || upper === "ROLE_ADMIN";
}

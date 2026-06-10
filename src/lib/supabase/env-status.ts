export function getSupabaseEnvStatus() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return {
    hasSupabaseUrl: Boolean(
      supabaseUrl && supabaseUrl !== "SUA_URL_DO_SUPABASE",
    ),
    hasAnonKey: Boolean(anonKey && anonKey !== "SUA_ANON_KEY"),
    hasServiceRoleKey: Boolean(
      serviceRoleKey && serviceRoleKey !== "SUA_SERVICE_ROLE_KEY",
    ),
  };
}

export function getMissingSupabaseEnvCode() {
  const status = getSupabaseEnvStatus();

  if (!status.hasSupabaseUrl) {
    return "missing_supabase_url";
  }

  if (!status.hasAnonKey) {
    return "missing_supabase_anon_key";
  }

  if (!status.hasServiceRoleKey) {
    return "missing_supabase_service_role";
  }

  return null;
}

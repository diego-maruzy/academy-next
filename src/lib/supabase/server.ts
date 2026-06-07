import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type SupabaseErrorShape = {
  message?: string;
  details?: string;
  hint?: string;
  code?: string;
};

let cachedReadClient: SupabaseClient | null | undefined;
let readClientWarningLogged = false;

export function formatSupabaseError(error: unknown) {
  if (error && typeof error === "object") {
    const supabaseError = error as SupabaseErrorShape;

    return {
      message: supabaseError.message ?? "Erro desconhecido do Supabase.",
      details: supabaseError.details,
      hint: supabaseError.hint,
      code: supabaseError.code,
    };
  }

  return {
    message: String(error),
  };
}

export function getSupabaseActionErrorMessage(error: unknown) {
  const formatted = formatSupabaseError(error);

  if (formatted.message === "Invalid API key") {
    return "SUPABASE_SERVICE_ROLE_KEY inválida ou revogada. Copie a chave service_role atual em Supabase → Settings → API e atualize o .env.local.";
  }

  if (formatted.message.includes("academy_shorts_video_provider_check")) {
    return "O banco ainda não aceita vídeos do Supabase Storage. Execute a migration supabase/academy-shorts-supabase-provider.sql no Supabase SQL Editor (ou rode npm run setup:shorts-provider).";
  }

  return formatted.message;
}

export function createSupabaseServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("Missing Supabase public environment variables.");
    return null;
  }

  if (
    supabaseUrl === "SUA_URL_DO_SUPABASE" ||
    supabaseAnonKey === "SUA_ANON_KEY"
  ) {
    console.error("Supabase public environment variables are still placeholders.");
    return null;
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export function createSupabaseServiceServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing Supabase service environment variables.");
    return null;
  }

  if (
    supabaseUrl === "SUA_URL_DO_SUPABASE" ||
    serviceRoleKey === "SUA_SERVICE_ROLE_KEY"
  ) {
    console.error("Supabase service environment variables are still placeholders.");
    return null;
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function probeSupabaseClient(client: SupabaseClient) {
  const { error } = await client
    .from("programs")
    .select("id", { head: true, count: "exact" });

  return !error;
}

export async function createSupabaseReadServerClient() {
  if (cachedReadClient !== undefined) {
    return cachedReadClient;
  }

  const serviceClient = createSupabaseServiceServerClient();

  if (serviceClient && (await probeSupabaseClient(serviceClient))) {
    cachedReadClient = serviceClient;
    return cachedReadClient;
  }

  if (serviceClient && !readClientWarningLogged) {
    readClientWarningLogged = true;
    console.warn(
      "[supabase] SUPABASE_SERVICE_ROLE_KEY inválida ou revogada. Leituras usarão a anon key. Atualize a service_role em Supabase → Settings → API.",
    );
  }

  cachedReadClient = createSupabaseServerClient();
  return cachedReadClient;
}

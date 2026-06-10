import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";

export async function getSupabaseAuthUser(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll() {
        // Middleware only reads the session here.
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

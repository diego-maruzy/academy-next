import { createServerClient } from "@supabase/ssr";
import { type NextRequest } from "next/server";
import { userHasAdminRole } from "@/lib/admin-auth/user-roles";

export type AdminMiddlewareState = {
  authenticated: boolean;
  isAdmin: boolean;
};

export async function resolveAdminMiddlewareState(
  request: NextRequest,
): Promise<AdminMiddlewareState> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return { authenticated: false, isAdmin: false };
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

  if (!user) {
    return { authenticated: false, isAdmin: false };
  }

  const isAdmin = await userHasAdminRole(supabase, user.id);

  return {
    authenticated: true,
    isAdmin,
  };
}

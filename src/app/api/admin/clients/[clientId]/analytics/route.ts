/**
 * Analytics do cliente — área admin.
 * Quando Keycloak estiver ativo, acesso deve exigir permissão administrativa adequada.
 */

import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { getClientAnalytics } from "@/lib/client-analytics";

type RouteContext = {
  params: Promise<{ clientId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const admin = await getCurrentAdmin();

  if (!admin) {
    return Response.json(
      { success: false, message: "Não autorizado." },
      { status: 401 },
    );
  }

  const { clientId } = await context.params;
  const analytics = await getClientAnalytics(clientId);

  if (!analytics) {
    return Response.json(
      {
        success: false,
        message: "Não foi possível carregar analytics do cliente.",
      },
      { status: 500 },
    );
  }

  return Response.json({
    success: true,
    analytics,
  });
}

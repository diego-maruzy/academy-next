"use server";

import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/admin-auth/current-admin";
import { isAdmin } from "@/lib/admin-auth/permissions";
import { importClientsFromRecords } from "@/lib/import/import-clients";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";

export async function importClientsFromJson(rawRecords: unknown) {
  const admin = await getCurrentAdmin();

  if (!admin || !isAdmin(admin)) {
    return {
      success: false,
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [{ email: "—", message: "Acesso não autorizado." }],
    };
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return {
      success: false,
      total: 0,
      created: 0,
      updated: 0,
      skipped: 0,
      errors: [{ email: "—", message: "Supabase não configurado." }],
    };
  }

  const summary = await importClientsFromRecords(supabase, rawRecords);

  if (summary.created > 0 || summary.updated > 0) {
    revalidatePath("/clientes");
    revalidatePath("/admin");
  }

  return summary;
}

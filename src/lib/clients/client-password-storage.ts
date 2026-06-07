import type { SupabaseClient } from "@supabase/supabase-js";
import { DEFAULT_CLIENT_PASSWORD } from "@/lib/clients/default-password";
import { mergeDefaultPasswordIntoNotes } from "@/lib/clients/client-password-notes";

function isMissingDefaultPasswordColumn(message: string) {
  return message.includes("default_password") && message.includes("does not exist");
}

export async function supportsDefaultPasswordColumn(
  supabase: SupabaseClient,
): Promise<boolean> {
  const { error } = await supabase
    .from("clients")
    .select("default_password")
    .limit(1);

  if (error && isMissingDefaultPasswordColumn(error.message)) {
    return false;
  }

  return !error;
}

export function applyDefaultPasswordFields<T extends Record<string, unknown>>(
  payload: T,
  options: {
    notes?: string | null;
    hasPasswordColumn: boolean;
  },
): T & { notes: string; default_password?: string } {
  const next = {
    ...payload,
    notes: mergeDefaultPasswordIntoNotes(options.notes),
  };

  if (options.hasPasswordColumn) {
    return {
      ...next,
      default_password: DEFAULT_CLIENT_PASSWORD,
    };
  }

  return next;
}

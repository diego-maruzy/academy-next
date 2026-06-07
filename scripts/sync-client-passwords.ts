import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { DEFAULT_CLIENT_PASSWORD } from "../src/lib/clients/default-password";
import { mergeDefaultPasswordIntoNotes } from "../src/lib/clients/client-password-notes";

config({ path: ".env.local" });

const MIGRATION_SQL = `alter table public.clients
  add column if not exists default_password text not null default '${DEFAULT_CLIENT_PASSWORD}';`;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function isMissingDefaultPasswordColumn(message: string) {
  return message.includes("default_password") && message.includes("does not exist");
}

async function detectColumnMode(): Promise<"column" | "legacy"> {
  const { error } = await supabase
    .from("clients")
    .select("default_password")
    .limit(1);

  if (error && isMissingDefaultPasswordColumn(error.message)) {
    return "legacy";
  }

  if (error) {
    throw new Error(error.message);
  }

  return "column";
}

async function main() {
  const mode = await detectColumnMode();

  if (mode === "legacy") {
    console.warn(
      "Coluna default_password ainda não existe. Execute no Supabase SQL Editor:",
    );
    console.warn(MIGRATION_SQL);
  }

  const { data: clients, error } = await supabase
    .from("clients")
    .select("id, email, notes, default_password");

  if (error) {
    if (isMissingDefaultPasswordColumn(error.message)) {
      const { data: legacyClients, error: legacyError } = await supabase
        .from("clients")
        .select("id, email, notes");

      if (legacyError) {
        throw new Error(legacyError.message);
      }

      let updated = 0;

      for (const client of legacyClients ?? []) {
        const notes = mergeDefaultPasswordIntoNotes(client.notes);
        const { error: updateError } = await supabase
          .from("clients")
          .update({ notes, updated_at: new Date().toISOString() })
          .eq("id", client.id);

        if (updateError) {
          throw new Error(`${client.email}: ${updateError.message}`);
        }

        updated += 1;
      }

      console.info(
        `Senha padrão registrada em notes para ${updated} cliente(s).`,
      );
      console.info(
        `Valor aplicado: ${DEFAULT_CLIENT_PASSWORD}. Rode a migration SQL para usar a coluna dedicada.`,
      );
      return;
    }

    throw new Error(error.message);
  }

  let updated = 0;

  for (const client of clients ?? []) {
    const needsColumnUpdate = client.default_password !== DEFAULT_CLIENT_PASSWORD;
    const notes = mergeDefaultPasswordIntoNotes(client.notes);

    const { error: updateError } = await supabase
      .from("clients")
      .update({
        default_password: DEFAULT_CLIENT_PASSWORD,
        notes,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id);

    if (updateError) {
      throw new Error(`${client.email}: ${updateError.message}`);
    }

    if (needsColumnUpdate) {
      updated += 1;
    }
  }

  console.info(`Senha padrão sincronizada para ${clients?.length ?? 0} cliente(s).`);
  console.info(`Atualizados agora: ${updated}`);
  console.info(`Valor: ${DEFAULT_CLIENT_PASSWORD}`);
}

main().catch((error) => {
  console.error(
    error instanceof Error ? error.message : "Erro inesperado ao sincronizar senhas.",
  );
  process.exit(1);
});

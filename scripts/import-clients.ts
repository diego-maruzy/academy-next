import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { importClientsFromRecords } from "../src/lib/import/import-clients";

config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local.",
  );
  process.exit(1);
}

const inputPath = resolve(
  process.cwd(),
  process.argv[2] ?? "src/data/clients-import.json",
);

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function loadJsonFile(path: string): unknown {
  const raw = readFileSync(path, "utf8");
  return JSON.parse(raw) as unknown;
}

async function main() {
  console.info(`Loading clients from ${inputPath}...`);

  const records = loadJsonFile(inputPath);
  const summary = await importClientsFromRecords(supabase, records);

  console.info("Import finished.");
  console.info(`Total processado: ${summary.total}`);
  console.info(`Novos criados: ${summary.created}`);
  console.info(`Atualizados: ${summary.updated}`);
  console.info(`Ignorados: ${summary.skipped}`);
  console.info(`Erros: ${summary.errors.length}`);

  if (summary.errors.length > 0) {
    console.info("Detalhes dos erros:");
    for (const item of summary.errors) {
      console.info(`- ${item.email}: ${item.message}`);
    }
  }

  if (!summary.success) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Unexpected import failure:", error);
  process.exit(1);
});

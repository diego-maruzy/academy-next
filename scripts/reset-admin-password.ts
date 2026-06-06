import { config } from "dotenv";
import bcrypt from "bcryptjs";
import { createClient } from "@supabase/supabase-js";

config({ path: ".env.local" });

const SALT_ROUNDS = 12;

const TEAM_AUTH_MIGRATION_SQL = `alter table public.team_members
add column if not exists password_hash text,
add column if not exists last_login_at timestamptz;`;

function isMissingPasswordHashColumn(message: string) {
  return (
    message.includes("password_hash") &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("Could not find"))
  );
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function main() {
  const email = process.argv[2]?.trim();
  const password = process.argv[3];

  if (!email) {
    fail("Informe o e-mail: npm run reset:admin-password -- email@exemplo.com NovaSenha123");
  }

  if (!password || password.length < 8) {
    fail("A senha deve ter pelo menos 8 caracteres.");
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    fail(
      "Supabase não configurado. Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local.",
    );
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { data: member, error: fetchError } = await supabase
    .from("team_members")
    .select("id, email")
    .eq("email", email)
    .maybeSingle();

  if (fetchError) {
    fail(`Erro ao buscar membro: ${fetchError.message}`);
  }

  if (!member) {
    fail(`Nenhum membro da equipe encontrado com o e-mail ${email}.`);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const { error: updateError } = await supabase
    .from("team_members")
    .update({
      password_hash: passwordHash,
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id);

  if (updateError) {
    if (isMissingPasswordHashColumn(updateError.message)) {
      fail(
        [
          "A coluna password_hash ainda não existe em team_members.",
          "Execute este SQL no Supabase → SQL Editor e rode o comando novamente:",
          "",
          TEAM_AUTH_MIGRATION_SQL,
          "",
          "Arquivo local: supabase/team-members-auth.sql",
        ].join("\n"),
      );
    }

    fail(`Erro ao atualizar senha: ${updateError.message}`);
  }

  console.log("Senha administrativa atualizada com sucesso");
}

main().catch((error: unknown) => {
  const message =
    error instanceof Error ? error.message : "Erro inesperado ao resetar senha.";
  fail(message);
});

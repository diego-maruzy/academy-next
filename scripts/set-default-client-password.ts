import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { writeFileSync } from "node:fs";

config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const DEFAULT_PASSWORD = "fliphouse2026";

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Faltam NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY no .env.local",
  );
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

type ClientAccessRow = {
  user_id: string;
  plan: "free" | "premium";
  status: string | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
};

type ResultItem = {
  user_id: string;
  email: string | null;
  action: "updated" | "created" | "skipped" | "error";
  reason?: string;
};

function getDisplayName(profile: ProfileRow) {
  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return profile.display_name || fullName || null;
}

async function main() {
  const results: ResultItem[] = [];

  const { data: clients, error: clientsError } = await supabase
    .from("client_access")
    .select("user_id, plan, status")
    .order("created_at", { ascending: false });

  if (clientsError) {
    throw new Error(`Erro ao buscar client_access: ${clientsError.message}`);
  }

  const clientRows = (clients ?? []) as ClientAccessRow[];

  for (const client of clientRows) {
    const { data: adminRole } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", client.user_id)
      .eq("role", "admin")
      .maybeSingle();

    if (adminRole) {
      results.push({
        user_id: client.user_id,
        email: null,
        action: "skipped",
        reason: "Usuário é admin",
      });
      continue;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, display_name, first_name, last_name")
      .eq("id", client.user_id)
      .maybeSingle();

    if (profileError || !profile) {
      results.push({
        user_id: client.user_id,
        email: null,
        action: "skipped",
        reason: profileError?.message || "Profile não encontrado",
      });
      continue;
    }

    const profileRow = profile as ProfileRow;

    if (!profileRow.email) {
      results.push({
        user_id: client.user_id,
        email: null,
        action: "skipped",
        reason: "Profile sem email",
      });
      continue;
    }

    const { data: existingUser, error: getUserError } =
      await supabase.auth.admin.getUserById(client.user_id);

    if (!getUserError && existingUser?.user) {
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        client.user_id,
        {
          password: DEFAULT_PASSWORD,
          email_confirm: true,
          user_metadata: {
            display_name: getDisplayName(profileRow),
            plan: client.plan,
          },
        },
      );

      results.push({
        user_id: client.user_id,
        email: profileRow.email,
        action: updateError ? "error" : "updated",
        reason: updateError?.message,
      });

      continue;
    }

    const { data: createdUser, error: createError } =
      await supabase.auth.admin.createUser({
        email: profileRow.email,
        password: DEFAULT_PASSWORD,
        email_confirm: true,
        user_metadata: {
          display_name: getDisplayName(profileRow),
          original_profile_id: client.user_id,
          plan: client.plan,
        },
      });

    if (createError) {
      results.push({
        user_id: client.user_id,
        email: profileRow.email,
        action: "error",
        reason: createError.message,
      });

      continue;
    }

    results.push({
      user_id: createdUser.user?.id ?? client.user_id,
      email: profileRow.email,
      action: "created",
      reason:
        createdUser.user?.id && createdUser.user.id !== client.user_id
          ? `Novo auth.users.id diferente do profile.id original: ${client.user_id}`
          : undefined,
    });
  }

  const summary = {
    total: results.length,
    updated: results.filter((item) => item.action === "updated").length,
    created: results.filter((item) => item.action === "created").length,
    skipped: results.filter((item) => item.action === "skipped").length,
    errors: results.filter((item) => item.action === "error").length,
  };

  const report = {
    defaultPassword: DEFAULT_PASSWORD,
    generatedAt: new Date().toISOString(),
    summary,
    results,
  };

  writeFileSync(
    "set-default-client-password-report.json",
    JSON.stringify(report, null, 2),
  );

  console.log("Resumo:");
  console.log(summary);
  console.log("Relatório salvo em set-default-client-password-report.json");
}

main().catch((error) => {
  console.error("Erro ao executar script:");
  console.error(error);
  process.exit(1);
});
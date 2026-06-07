import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { join } from "node:path";

config({ path: ".env.local" });

const MIGRATION_PATH = join(
  process.cwd(),
  "supabase/academy-shorts-supabase-provider.sql",
);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing Supabase env vars in .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function isProviderConstraintError(message: string) {
  return message.includes("academy_shorts_video_provider_check");
}

async function main() {
  const slug = `_provider-check-${Date.now()}`;

  const { data, error } = await supabase
    .from("academy_shorts")
    .insert({
      title: "Provider check",
      slug,
      video_url: `${supabaseUrl}/storage/v1/object/public/reels/test.mp4`,
      video_provider: "supabase",
      published: false,
      featured: false,
      display_order: 9999,
    })
    .select("id")
    .single();

  if (error) {
    if (isProviderConstraintError(error.message)) {
      console.error(
        "O banco ainda não aceita video_provider = supabase. Execute no Supabase → SQL Editor:\n",
      );
      console.error(readFileSync(MIGRATION_PATH, "utf8"));
      process.exit(1);
    }

    throw new Error(error.message);
  }

  await supabase.from("academy_shorts").delete().eq("id", data.id);

  console.info("OK: academy_shorts aceita video_provider = supabase.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});

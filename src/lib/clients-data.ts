import { createSupabaseReadServerClient } from "@/lib/supabase/server";

export type ClientRow = {
  id: string;
  keycloak_id: string | null;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
  source: string | null;
  program_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  programs?: { name: string } | { name: string }[] | null;
};

export async function getClients(): Promise<ClientRow[]> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    console.error("Supabase não configurado para buscar clientes.");
    return [];
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*, programs(name)")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erro ao buscar clientes:", error.message);
    return [];
  }

  return (data ?? []) as ClientRow[];
}

export async function getClientById(id: string): Promise<ClientRow | null> {
  const supabase = await createSupabaseReadServerClient();

  if (!supabase) {
    return null;
  }

  const { data, error } = await supabase
    .from("clients")
    .select("*, programs(name)")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Erro ao buscar cliente:", error.message);
    return null;
  }

  return (data as ClientRow | null) ?? null;
}

export function getProgramNameFromClient(client: ClientRow) {
  if (!client.programs) {
    return null;
  }

  if (Array.isArray(client.programs)) {
    return client.programs[0]?.name ?? null;
  }

  return client.programs.name ?? null;
}

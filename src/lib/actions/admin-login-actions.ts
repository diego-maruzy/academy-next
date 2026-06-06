"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { verifyPassword } from "@/lib/admin-auth/password";
import { getDefaultAdminPath } from "@/lib/admin-auth/permissions";
import {
  createAdminSession,
  getAdminSessionSecretError,
} from "@/lib/admin-auth/session";
import { createSupabaseServiceServerClient } from "@/lib/supabase/server";

const loginSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  password: z.string().min(1, "Informe a senha."),
});

type TeamMemberAuthRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  permission: string;
  status: string;
  password_hash: string | null;
};

export async function loginAdminAction(formData: FormData) {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return {
      success: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const sessionSecretError = getAdminSessionSecretError();

  if (sessionSecretError) {
    console.error("[admin-login] Configuração inválida:", sessionSecretError);
    return {
      success: false as const,
      error:
        "Login administrativo não configurado no servidor. Contate o administrador do sistema.",
    };
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return {
      success: false as const,
      error: "Não foi possível autenticar no momento. Tente novamente.",
    };
  }

  const { data, error } = await supabase
    .from("team_members")
    .select(
      "id, email, full_name, role, permission, status, password_hash",
    )
    .eq("email", parsed.data.email.trim())
    .maybeSingle();

  if (error) {
    console.error("[admin-login] Erro ao buscar membro:", error.message);
    return {
      success: false as const,
      error: "E-mail ou senha inválidos.",
    };
  }

  const member = data as TeamMemberAuthRow | null;

  if (!member) {
    return {
      success: false as const,
      error: "E-mail ou senha inválidos.",
    };
  }

  if (member.status !== "active") {
    return {
      success: false as const,
      error: "E-mail ou senha inválidos.",
    };
  }

  if (!member.password_hash) {
    return {
      success: false as const,
      error: "Senha administrativa ainda não configurada.",
    };
  }

  const passwordValid = await verifyPassword(
    parsed.data.password,
    member.password_hash,
  );

  if (!passwordValid) {
    return {
      success: false as const,
      error: "E-mail ou senha inválidos.",
    };
  }

  await createAdminSession({
    id: member.id,
    email: member.email,
    full_name: member.full_name,
    role: member.role,
    permission: member.permission,
  });

  await supabase
    .from("team_members")
    .update({
      last_login_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", member.id);

  redirect(getDefaultAdminPath());
}

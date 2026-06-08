import { NextResponse } from "next/server";
import { z } from "zod";
import { verifyPassword } from "@/lib/admin-auth/password";
import {
  createAdminSession,
  getAdminSessionSecretError,
} from "@/lib/admin-auth/admin-session";
import { getDefaultAdminPath } from "@/lib/admin-auth/permissions";
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

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "E-mail ou senha inválidos." },
      { status: 400 },
    );
  }

  const parsed = loginSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "E-mail ou senha inválidos." },
      { status: 400 },
    );
  }

  const sessionSecretError = getAdminSessionSecretError();

  if (sessionSecretError) {
    console.error("[api/admin/login] Configuração inválida:", sessionSecretError);
    return NextResponse.json(
      {
        success: false,
        error:
          "Login administrativo não configurado no servidor. Contate o administrador do sistema.",
      },
      { status: 500 },
    );
  }

  const supabase = createSupabaseServiceServerClient();

  if (!supabase) {
    return NextResponse.json(
      { success: false, error: "E-mail ou senha inválidos." },
      { status: 500 },
    );
  }

  const email = parsed.data.email.trim().toLowerCase();

  const { data, error } = await supabase
    .from("team_members")
    .select(
      "id, email, full_name, role, permission, status, password_hash",
    )
    .eq("email", email)
    .maybeSingle();

  if (error) {
    console.error("[api/admin/login] Erro ao buscar membro:", error.message);
    return NextResponse.json(
      { success: false, error: "E-mail ou senha inválidos." },
      { status: 400 },
    );
  }

  const member = data as TeamMemberAuthRow | null;

  if (
    !member ||
    member.status !== "active" ||
    !member.password_hash ||
    !(await verifyPassword(parsed.data.password, member.password_hash))
  ) {
    return NextResponse.json(
      { success: false, error: "E-mail ou senha inválidos." },
      { status: 400 },
    );
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

  return NextResponse.json({
    success: true,
    redirectTo: getDefaultAdminPath(),
  });
}

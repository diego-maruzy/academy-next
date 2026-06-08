import { NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";

const TEST_EMAIL_SUBJECT = "Teste Resend - Checkmate Academy Next";

const TEST_EMAIL_HTML = `
  <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 560px;">
    <h2 style="margin: 0 0 16px; font-size: 22px;">Resend configurado com sucesso</h2>
    <p style="margin: 0 0 12px;">
      Este é um email de teste enviado pela nova aplicação Next.js da Checkmate Academy.
    </p>
    <p style="margin: 0;">
      Se você recebeu este email, a integração com o Resend está funcionando corretamente.
    </p>
  </div>
`;

function isTestRouteAuthorized(request: Request): boolean {
  const secret = process.env.TEST_EMAIL_SECRET?.trim();

  if (!secret) {
    return false;
  }

  return request.headers.get("x-test-secret") === secret;
}

export async function POST(request: Request) {
  if (!isTestRouteAuthorized(request)) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Não autorizado. Envie o header x-test-secret com TEST_EMAIL_SECRET.",
      },
      { status: 401 },
    );
  }

  try {
    if (!process.env.RESEND_API_KEY?.trim()) {
      return NextResponse.json(
        { success: false, error: "RESEND_API_KEY não configurada" },
        { status: 500 },
      );
    }

    const fromEmail = process.env.RESEND_FROM_EMAIL?.trim();

    if (!fromEmail) {
      return NextResponse.json(
        { success: false, error: "RESEND_FROM_EMAIL não configurada" },
        { status: 500 },
      );
    }

    const adminTestEmail = process.env.ADMIN_TEST_EMAIL?.trim();

    if (!adminTestEmail) {
      return NextResponse.json(
        { success: false, error: "ADMIN_TEST_EMAIL não configurado" },
        { status: 500 },
      );
    }

    const resend = getResendClient();

    if (!resend) {
      return NextResponse.json(
        { success: false, error: "Cliente Resend indisponível." },
        { status: 500 },
      );
    }

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: adminTestEmail,
      subject: TEST_EMAIL_SUBJECT,
      html: TEST_EMAIL_HTML,
    });

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: error.message ?? "Falha ao enviar e-mail de teste.",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: data?.id ?? null,
      },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Erro desconhecido",
      },
      { status: 500 },
    );
  }
}

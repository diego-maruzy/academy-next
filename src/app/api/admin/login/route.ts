import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Use o login administrativo em /admin/login com Supabase Auth.",
    },
    { status: 410 },
  );
}

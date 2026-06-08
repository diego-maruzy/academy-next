import Link from "next/link";
import { BookOpen, PlaySquare } from "lucide-react";
import { getPublishedPrograms } from "@/lib/academy-data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentClient } from "@/lib/current-client";
import { recordStudentActivity } from "@/lib/student-activity";

export const dynamic = "force-dynamic";

export default async function StudentDashboardPage() {
  const user = await getCurrentUser();
  const client = await getCurrentClient();

  if (client) {
    void recordStudentActivity({
      clientId: client.id,
      eventType: "platform_access",
    });
  }

  const programs = await getPublishedPrograms();

  return (
    <div className="grid min-w-0 gap-6 md:gap-8">
      <section className="min-w-0">
        <h1 className="break-words text-2xl font-bold tracking-tight text-white sm:text-3xl md:text-4xl">
          Olá, {user.name} 👋
        </h1>
        <p className="mt-1.5 text-sm text-slate-400 md:mt-2 md:text-base">
          Bem-vindo à Checkmate Academy.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/programas"
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-emerald-400/30 hover:bg-white/[0.05]"
        >
          <BookOpen className="h-8 w-8 text-emerald-300" />
          <h2 className="mt-4 text-lg font-semibold text-white">Programas</h2>
          <p className="mt-1 text-sm text-slate-400">
            {programs.length > 0
              ? `${programs.length} programa(s) disponível(is)`
              : "Explore os conteúdos da Academy"}
          </p>
        </Link>

        <Link
          href="/reels"
          className="group rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-sky-400/30 hover:bg-white/[0.05]"
        >
          <PlaySquare className="h-8 w-8 text-sky-300" />
          <h2 className="mt-4 text-lg font-semibold text-white">Reels</h2>
          <p className="mt-1 text-sm text-slate-400">
            Vídeos curtos e conteúdos rápidos
          </p>
        </Link>
      </section>
    </div>
  );
}

import { Edit3, ExternalLink, Eye, Layers3, Plus } from "lucide-react";
import { DeleteConfirmButton } from "@/components/admin/programs/delete-confirm-button";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getPrograms } from "@/lib/academy-data";

export const dynamic = "force-dynamic";

export default async function AdminProgramsPage() {
  const programs = await getPrograms();

  return (
    <div className="grid gap-8">
      <section className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
            Gestão
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
            Programas ADM
          </h1>
          <p className="mt-2 max-w-2xl text-slate-400">
            Crie, edite e organize programas, módulos e aulas no Supabase.
          </p>
        </div>
        <ButtonLink href="/admin/programas/novo">
          <Plus className="mr-2 h-4 w-4" />
          Novo programa
        </ButtonLink>
      </section>

      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-white/10 bg-white/5 text-xs uppercase tracking-[0.2em] text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-semibold">Nome</th>
                  <th className="px-6 py-4 font-semibold">Slug</th>
                  <th className="px-6 py-4 font-semibold">Publicado</th>
                  <th className="px-6 py-4 font-semibold">Premium</th>
                  <th className="px-6 py-4 font-semibold">Upgrade</th>
                  <th className="px-6 py-4 font-semibold">Módulos</th>
                  <th className="px-6 py-4 font-semibold">Ordem</th>
                  <th className="px-6 py-4 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {programs.map((program) => (
                  <tr key={program.id} className="text-slate-300">
                    <td className="px-6 py-5 font-medium text-white">
                      {program.name}
                    </td>
                    <td className="px-6 py-5">{program.slug}</td>
                    <td className="px-6 py-5">
                      <Badge>{program.published ? "Publicado" : "Rascunho"}</Badge>
                    </td>
                    <td className="px-6 py-5">
                      <Badge className="border-white/10 bg-white/5 text-slate-300">
                        {program.is_premium ? "Premium" : "Não"}
                      </Badge>
                    </td>
                    <td className="px-6 py-5">
                      {program.is_premium && program.upgrade_url ? (
                        <a
                          href={program.upgrade_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-200"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                          Configurado
                        </a>
                      ) : program.is_premium ? (
                        <span className="text-xs text-slate-500">Padrão</span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-6 py-5">
                      <span className="inline-flex items-center gap-2">
                        <Layers3 className="h-4 w-4 text-blue-300" />
                        {program.modules.length}
                      </span>
                    </td>
                    <td className="px-6 py-5">{program.display_order}</td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap justify-end gap-2">
                        <ButtonLink
                          href={`/admin/programas/${program.id}`}
                          variant="secondary"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Ver
                        </ButtonLink>
                        <ButtonLink
                          href={`/admin/programas/${program.id}/editar`}
                          variant="secondary"
                        >
                          <Edit3 className="mr-2 h-4 w-4" />
                          Editar
                        </ButtonLink>
                        <DeleteConfirmButton type="program" id={program.id} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

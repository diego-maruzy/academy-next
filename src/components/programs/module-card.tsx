import { ArrowUpRight, ImageIcon, PlayCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type ModuleCardProps = {
  programId: string;
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  status: string;
  lessonCount: number;
};

export function ModuleCard({
  programId,
  id,
  title,
  description,
  coverUrl,
  status,
  lessonCount,
}: ModuleCardProps) {
  return (
    <Card className="grid overflow-hidden md:grid-cols-[220px_1fr]">
      <div
        className="min-h-48 bg-cover bg-center"
        style={{ backgroundImage: `url(${coverUrl})` }}
      >
        <div className="flex h-full items-start justify-end bg-slate-950/20 p-4">
          <div className="rounded-full bg-slate-950/70 p-2 text-white">
            <ImageIcon className="h-4 w-4" />
          </div>
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3">
          <Badge>{status}</Badge>
          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
            <PlayCircle className="h-4 w-4 text-emerald-300" />
            {lessonCount} aulas
          </span>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
        <div className="mt-6">
          <ButtonLink
            href={`/programas/${programId}/modulos/${id}`}
            variant="secondary"
          >
            Ver módulo
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

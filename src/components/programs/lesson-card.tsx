import { Edit3, ExternalLink, Video } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type LessonCardProps = {
  programId: string;
  moduleId: string;
  id: string;
  title: string;
  vimeoUrl: string;
  ctaLabel: string;
  status: string;
  order: number;
};

export function LessonCard({
  programId,
  moduleId,
  id,
  title,
  vimeoUrl,
  ctaLabel,
  status,
  order,
}: LessonCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 pt-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge>Aula {order}</Badge>
              <Badge className="border-white/10 bg-white/5 text-slate-300">
                {status}
              </Badge>
            </div>
            <h3 className="mt-3 text-lg font-semibold text-white">{title}</h3>
            <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-400">
              <span className="inline-flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                {vimeoUrl}
              </span>
              <span>CTA: {ctaLabel}</span>
            </div>
          </div>
        </div>
        <ButtonLink
          href={`/programas/${programId}/modulos/${moduleId}/aulas/${id}/editar`}
          variant="secondary"
        >
          <Edit3 className="mr-2 h-4 w-4" />
          Editar
        </ButtonLink>
      </CardContent>
    </Card>
  );
}

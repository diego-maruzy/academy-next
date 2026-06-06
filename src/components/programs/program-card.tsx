import { ArrowUpRight, Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

type ProgramCardProps = {
  id: string;
  title: string;
  description: string;
  status: string;
  moduleCount: number;
};

export function ProgramCard({
  id,
  title,
  description,
  status,
  moduleCount,
}: ProgramCardProps) {
  return (
    <Card className="overflow-hidden transition hover:border-emerald-400/30 hover:bg-white/[0.07]">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <Badge>{status}</Badge>
            <h3 className="mt-4 text-xl font-semibold text-white">{title}</h3>
          </div>
          <div className="rounded-2xl bg-emerald-400/10 p-3 text-emerald-300">
            <Layers className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <p className="min-h-16 text-sm leading-6 text-slate-400">
          {description}
        </p>
        <div className="mt-6 flex items-center justify-between gap-4">
          <span className="text-sm text-slate-400">
            {moduleCount} módulos
          </span>
          <ButtonLink href={`/programas/${id}`} variant="secondary">
            Ver programa
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </ButtonLink>
        </div>
      </CardContent>
    </Card>
  );
}

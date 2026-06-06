import { Settings } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <div className="grid gap-8">
      <section>
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-blue-300">
          Administração
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">
          Configurações
        </h1>
        <p className="mt-2 max-w-2xl text-slate-400">
          Espaço inicial para preferências da plataforma e ajustes visuais.
        </p>
      </section>

      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">
            <Settings className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white">
              Configurações gerais
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Dados mockados por enquanto, sem integração externa.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

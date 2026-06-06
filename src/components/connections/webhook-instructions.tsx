import { Cable } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const steps = [
  "No formulário, abra JetForm → Post Submit Actions e adicione Call a Webhook.",
  "Cole a URL do webhook gerada abaixo.",
  "Método: POST.",
  "Envie os campos name, email, phone e password.",
  "Cada envio criará ou atualizará o cliente no Academy.",
];

export function WebhookInstructions() {
  return (
    <Card className="bg-blue-500/[0.06]">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-300">
            <Cable className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Como configurar no JetFormBuilder
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Use uma ação de POST para enviar dados ao endpoint público.
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="grid gap-3 text-sm text-slate-300">
          {steps.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-bold text-white">
                {index + 1}
              </span>
              <span>{step}</span>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

"use client";

import { useMemo, useState, useTransition } from "react";
import { FlaskConical, Mail, Save } from "lucide-react";
import { EmailTemplateEditor } from "@/components/emails/email-template-editor";
import {
  sendTestEmailAction,
  updateEmailTemplate,
} from "@/lib/actions/email-template-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form-controls";
import type { EmailBillingType, EmailTemplate } from "@/types/email";

const MAX_TEAM_RECIPIENTS = 20;

type EmailPlanConfigCardProps = {
  billingType: EmailBillingType;
  planTitle: string;
  customerTemplate: EmailTemplate;
  teamTemplate: EmailTemplate;
};

type TemplateFormState = {
  enabled: boolean;
  subject: string;
  htmlBody: string;
  teamRecipients: string[];
};

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function EmailPlanConfigCard({
  billingType,
  planTitle,
  customerTemplate,
  teamTemplate,
}: EmailPlanConfigCardProps) {
  const [customer, setCustomer] = useState<TemplateFormState>({
    enabled: customerTemplate.enabled,
    subject: customerTemplate.subject,
    htmlBody: customerTemplate.html_body,
    teamRecipients: [],
  });
  const [team, setTeam] = useState<TemplateFormState>({
    enabled: teamTemplate.enabled,
    subject: teamTemplate.subject,
    htmlBody: teamTemplate.html_body,
    teamRecipients: teamTemplate.team_recipients ?? [],
  });
  const [recipientInput, setRecipientInput] = useState("");
  const [testEmail, setTestEmail] = useState(
    teamTemplate.team_recipients[0] ?? "",
  );
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const testRecipient = useMemo(() => {
    const trimmed = testEmail.trim();
    if (trimmed) {
      return trimmed;
    }

    return team.teamRecipients[0] ?? "";
  }, [testEmail, team.teamRecipients]);

  function addRecipient() {
    const email = recipientInput.trim().toLowerCase();

    if (!email) {
      setError("Informe um e-mail para adicionar.");
      return;
    }

    if (!isValidEmail(email)) {
      setError("Informe um e-mail válido.");
      return;
    }

    if (team.teamRecipients.includes(email)) {
      setError("Este e-mail já está na lista.");
      return;
    }

    if (team.teamRecipients.length >= MAX_TEAM_RECIPIENTS) {
      setError("Limite máximo de 20 destinatários atingido.");
      return;
    }

    setTeam((current) => ({
      ...current,
      teamRecipients: [...current.teamRecipients, email],
    }));
    setRecipientInput("");
    setError(null);
  }

  function removeRecipient(email: string) {
    setTeam((current) => ({
      ...current,
      teamRecipients: current.teamRecipients.filter((item) => item !== email),
    }));
  }

  function handleSave() {
    setError(null);
    setFeedback(null);

    startTransition(async () => {
      const customerResult = await updateEmailTemplate(customerTemplate.id, {
        enabled: customer.enabled,
        subject: customer.subject,
        html_body: customer.htmlBody,
      });

      if (!customerResult.success) {
        setError(customerResult.error ?? "Erro ao salvar e-mail do cliente.");
        return;
      }

      const teamResult = await updateEmailTemplate(teamTemplate.id, {
        enabled: team.enabled,
        subject: team.subject,
        html_body: team.htmlBody,
        team_recipients: team.teamRecipients,
      });

      if (!teamResult.success) {
        setError(teamResult.error ?? "Erro ao salvar e-mail da equipe.");
        return;
      }

      setFeedback("Configurações salvas com sucesso.");
    });
  }

  function handleTest() {
    setError(null);
    setFeedback(null);

    if (!testRecipient || !isValidEmail(testRecipient)) {
      setError("Informe um e-mail válido para o teste.");
      return;
    }

    startTransition(async () => {
      const customerTest = await sendTestEmailAction({
        billingType,
        templateType: "customer",
        recipient: testRecipient,
      });

      const teamTest = await sendTestEmailAction({
        billingType,
        templateType: "team",
        recipient: testRecipient,
      });

      const stubbed =
        customerTest.status === "stub" || teamTest.status === "stub";
      const failed = !customerTest.success || !teamTest.success;

      if (failed) {
        setError(
          customerTest.error ??
            teamTest.error ??
            "Falha ao disparar teste de e-mail.",
        );
        return;
      }

      if (stubbed) {
        setFeedback(
          "Teste registrado em modo stub. Configure RESEND_API_KEY para envio real.",
        );
        return;
      }

      setFeedback("E-mails de teste enviados com sucesso.");
    });
  }

  return (
    <Card className="overflow-hidden border-white/10 bg-white/[0.03]">
      <CardContent className="grid gap-6 pt-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 text-sky-300">
              <Mail className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-2xl font-semibold text-white">{planTitle}</h2>
              <p className="mt-1 text-sm text-slate-400">
                Templates de confirmação e notificação interna.
              </p>
            </div>
          </div>
          <Badge className="border-sky-400/20 bg-sky-400/10 text-sky-200">
            {billingType}
          </Badge>
        </div>

        <EmailTemplateEditor
          template={customerTemplate}
          enabled={customer.enabled}
          subject={customer.subject}
          htmlBody={customer.htmlBody}
          teamRecipients={[]}
          recipientInput=""
          onEnabledChange={(value) =>
            setCustomer((current) => ({ ...current, enabled: value }))
          }
          onSubjectChange={(value) =>
            setCustomer((current) => ({ ...current, subject: value }))
          }
          onHtmlBodyChange={(value) =>
            setCustomer((current) => ({ ...current, htmlBody: value }))
          }
          onRecipientInputChange={() => undefined}
          onAddRecipient={() => undefined}
          onRemoveRecipient={() => undefined}
        />

        <EmailTemplateEditor
          template={teamTemplate}
          enabled={team.enabled}
          subject={team.subject}
          htmlBody={team.htmlBody}
          teamRecipients={team.teamRecipients}
          recipientInput={recipientInput}
          onEnabledChange={(value) =>
            setTeam((current) => ({ ...current, enabled: value }))
          }
          onSubjectChange={(value) =>
            setTeam((current) => ({ ...current, subject: value }))
          }
          onHtmlBodyChange={(value) =>
            setTeam((current) => ({ ...current, htmlBody: value }))
          }
          onRecipientInputChange={setRecipientInput}
          onAddRecipient={addRecipient}
          onRemoveRecipient={removeRecipient}
        />

        <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4 sm:p-5">
          <Field label="E-mail para teste">
            <Input
              type="email"
              value={testEmail}
              onChange={(event) => setTestEmail(event.target.value)}
              placeholder="teste@checkmateproperty.com"
            />
          </Field>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        ) : null}

        {feedback ? (
          <p className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {feedback}
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            type="button"
            className="gap-2"
            disabled={pending}
            onClick={handleSave}
          >
            <Save className="h-4 w-4" />
            Salvar
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="gap-2"
            disabled={pending}
            onClick={handleTest}
          >
            <FlaskConical className="h-4 w-4" />
            Disparar teste
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

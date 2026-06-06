"use client";

import { useRef } from "react";
import { Mail, X } from "lucide-react";
import { EmailVariableChips } from "@/components/emails/email-variable-chips";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form-controls";
import type { EmailTemplate } from "@/types/email";
import { cn } from "@/lib/utils";

const MAX_TEAM_RECIPIENTS = 20;

type EmailTemplateEditorProps = {
  template: EmailTemplate;
  enabled: boolean;
  subject: string;
  htmlBody: string;
  teamRecipients: string[];
  recipientInput: string;
  onEnabledChange: (value: boolean) => void;
  onSubjectChange: (value: string) => void;
  onHtmlBodyChange: (value: string) => void;
  onRecipientInputChange: (value: string) => void;
  onAddRecipient: () => void;
  onRemoveRecipient: (email: string) => void;
};

function EnabledToggle({
  enabled,
  onChange,
}: {
  enabled: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className={cn(
        "relative h-7 w-12 shrink-0 rounded-full transition",
        enabled ? "bg-emerald-500" : "bg-slate-700",
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition",
          enabled ? "left-[22px]" : "left-0.5",
        )}
      />
    </button>
  );
}

export function EmailTemplateEditor({
  template,
  enabled,
  subject,
  htmlBody,
  teamRecipients,
  recipientInput,
  onEnabledChange,
  onSubjectChange,
  onHtmlBodyChange,
  onRecipientInputChange,
  onAddRecipient,
  onRemoveRecipient,
}: EmailTemplateEditorProps) {
  const htmlRef = useRef<HTMLTextAreaElement>(null);
  const isTeam = template.template_type === "team";
  const title = isTeam ? "E-mail para a equipe" : "E-mail para o cliente";

  function insertVariable(variable: string) {
    const element = htmlRef.current;

    if (!element) {
      onHtmlBodyChange(`${htmlBody}${variable}`);
      return;
    }

    const start = element.selectionStart ?? htmlBody.length;
    const end = element.selectionEnd ?? htmlBody.length;
    const next = `${htmlBody.slice(0, start)}${variable}${htmlBody.slice(end)}`;
    onHtmlBodyChange(next);

    requestAnimationFrame(() => {
      element.focus();
      const cursor = start + variable.length;
      element.setSelectionRange(cursor, cursor);
    });
  }

  return (
    <section className="grid gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-slate-950/60 text-sky-300">
            <Mail className="h-4 w-4" />
          </span>
          <div>
            <h3 className="text-lg font-semibold text-white">{title}</h3>
            <p className="text-sm text-slate-400">
              {isTeam
                ? "Notificação interna para a equipe após pagamento aprovado."
                : "Confirmação enviada ao cliente após pagamento aprovado."}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className="text-xs font-medium text-slate-400">
            {enabled ? "Ativo" : "Inativo"}
          </span>
          <EnabledToggle enabled={enabled} onChange={onEnabledChange} />
        </div>
      </div>

      <Field label="Assunto">
        <Input
          value={subject}
          onChange={(event) => onSubjectChange(event.target.value)}
          placeholder="Assunto do e-mail"
        />
      </Field>

      <div className="grid gap-3">
        <Field label="Corpo HTML">
          <Textarea
            ref={htmlRef}
            value={htmlBody}
            onChange={(event) => onHtmlBodyChange(event.target.value)}
            className="min-h-[220px] font-mono text-xs leading-relaxed sm:min-h-[280px] sm:text-sm"
            placeholder="<html>...</html>"
          />
        </Field>
        <EmailVariableChips onInsert={insertVariable} />
      </div>

      {isTeam ? (
        <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-slate-200">
              Destinatários da equipe
            </p>
            <span className="text-xs text-slate-500">
              {teamRecipients.length}/{MAX_TEAM_RECIPIENTS}
            </span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              value={recipientInput}
              onChange={(event) => onRecipientInputChange(event.target.value)}
              placeholder="equipe@checkmateproperty.com"
              className="min-w-0 flex-1"
            />
            <Button
              type="button"
              variant="secondary"
              className="shrink-0"
              disabled={teamRecipients.length >= MAX_TEAM_RECIPIENTS}
              onClick={onAddRecipient}
            >
              Adicionar
            </Button>
          </div>

          {teamRecipients.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {teamRecipients.map((email) => (
                <span
                  key={email}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-sm text-slate-200"
                >
                  {email}
                  <button
                    type="button"
                    onClick={() => onRemoveRecipient(email)}
                    className="text-slate-400 transition hover:text-white"
                    aria-label={`Remover ${email}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Nenhum destinatário configurado.
            </p>
          )}
        </div>
      ) : null}
    </section>
  );
}

import { EmailsPageContent } from "@/components/emails/emails-page-content";
import {
  getEmailSendLogs,
  getEmailTemplates,
} from "@/lib/actions/email-template-actions";

export const dynamic = "force-dynamic";

export default async function AdminEmailsPage() {
  const [templates, logs] = await Promise.all([
    getEmailTemplates(),
    getEmailSendLogs(50),
  ]);

  return <EmailsPageContent templates={templates} logs={logs} />;
}

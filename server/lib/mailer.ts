import nodemailer, { type Transporter } from "nodemailer";
import { config } from "../config.ts";

export interface Mail {
  to: string;
  subject: string;
  /** Plain text. Emails are text-only so there is nothing to escape or render differently per client. */
  text: string;
}

/** True when emails can actually be delivered or, in development, printed to the log. */
export const emailEnabled = config.mail.mode !== "off";

let transport: Transporter | null = null;

function getTransport() {
  transport ??= nodemailer.createTransport({
    host: config.mail.host ?? undefined,
    port: config.mail.port,
    secure: config.mail.secure,
    auth: config.mail.user && config.mail.password ? { user: config.mail.user, pass: config.mail.password } : undefined,
    // Don't let a slow mail server hold up the request that triggered the email.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });
  return transport;
}

/** Subjects and addresses must be a single line. */
const oneLine = (value: string) => value.replace(/[\r\n]+/g, " ").trim();

/**
 * Sends one email. Throws if delivery fails, so callers that need to know (such as verification) can say so.
 * Use notify() for messages where a failure should only be logged.
 */
export async function sendMail(mail: Mail): Promise<void> {
  const subject = oneLine(mail.subject);
  const to = oneLine(mail.to);

  if (config.mail.mode === "off") {
    throw new Error("Email is not configured on this server.");
  }
  if (config.mail.mode === "log") {
    console.log(`\n[mail] To: ${to}\n[mail] Subject: ${subject}\n${mail.text}\n[mail] ----`);
    return;
  }
  await getTransport().sendMail({ from: config.mail.from, to, subject, text: mail.text });
}

/** Sends an email without ever throwing or making the caller wait. Failures are logged without the message body. */
export function notify(mail: Mail): void {
  if (config.mail.mode === "off") return;
  sendMail(mail).catch((err: unknown) => {
    console.error(`Could not send "${oneLine(mail.subject)}":`, err instanceof Error ? err.message : err);
  });
}

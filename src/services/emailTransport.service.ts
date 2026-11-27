import "server-only";
import nodemailer from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool";
import { getEmailServerEnv, type EmailServerEnv } from "@/lib/env";
import type { EmailMessage } from "@/lib/emailMessages";

export type EmailFailure = { permanent: boolean; safeMessage: string };

type ErrorRecord = { responseCode?: unknown; code?: unknown };

export function classifyEmailError(error: unknown): EmailFailure {
  const record = error && typeof error === "object" ? error as ErrorRecord : {};
  const responseCode = typeof record.responseCode === "number" ? record.responseCode : 0;
  if (responseCode >= 500 && responseCode <= 599) {
    return { permanent: true, safeMessage: `Email was rejected by the receiving server (${responseCode}).` };
  }
  if (responseCode >= 400 && responseCode <= 499) {
    return { permanent: false, safeMessage: `SMTP temporarily unavailable (${responseCode}).` };
  }
  return { permanent: false, safeMessage: "Email service connection failed." };
}

export function createEmailTransportOptions(env: EmailServerEnv): SMTPPool.Options {
  return {
    host: env.host,
    port: env.port,
    secure: env.secure,
    requireTLS: !env.secure,
    pool: true,
    maxConnections: 2,
    maxMessages: 25,
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
    auth: { user: env.user, pass: env.password },
    tls: { minVersion: "TLSv1.2" },
  };
}

let transport: ReturnType<typeof nodemailer.createTransport> | null = null;

export async function sendEmailMessage(message: EmailMessage) {
  const env = getEmailServerEnv();
  transport ??= nodemailer.createTransport(createEmailTransportOptions(env));
  await transport.sendMail({
    from: { name: env.fromName, address: env.fromAddress },
    to: message.to,
    replyTo: message.replyTo || env.replyTo,
    subject: message.subject,
    text: message.text,
    html: message.html,
    messageId: message.messageId,
  });
}

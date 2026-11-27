import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { sendMail, createTransport } = vi.hoisted(() => ({
  sendMail: vi.fn(),
  createTransport: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("nodemailer", () => ({
  default: { createTransport },
}));

import { getEmailServerEnv, ServerConfigurationError } from "@/lib/env";
import {
  classifyEmailError,
  createEmailTransportOptions,
  sendEmailMessage,
} from "@/services/emailTransport.service";

const validEnv = {
  SMTP_HOST: "mail.regitech.co.uk",
  SMTP_PORT: "465",
  SMTP_SECURE: "true",
  SMTP_USER: "info@regitech.co.uk",
  SMTP_PASSWORD: "private-test-password",
  EMAIL_FROM_NAME: "Regi Tech",
  EMAIL_FROM_ADDRESS: "info@regitech.co.uk",
  EMAIL_REPLY_TO: "info@regitech.co.uk",
  EMAIL_ADMIN_RECIPIENT: "info@regitech.co.uk",
  EMAIL_WORKER_SECRET: "worker-secret-with-at-least-32-characters",
};

describe("email server configuration", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "test");
    for (const [key, value] of Object.entries(validEnv)) vi.stubEnv(key, value);
  });

  afterEach(() => vi.unstubAllEnvs());

  it("accepts Bluehost port 465 with implicit TLS", () => {
    expect(getEmailServerEnv()).toMatchObject({
      host: "mail.regitech.co.uk",
      port: 465,
      secure: true,
      user: "info@regitech.co.uk",
      fromName: "Regi Tech",
      fromAddress: "info@regitech.co.uk",
    });
  });

  it("accepts Bluehost port 587 with explicit TLS", () => {
    vi.stubEnv("SMTP_PORT", "587");
    vi.stubEnv("SMTP_SECURE", "false");

    expect(getEmailServerEnv()).toMatchObject({ port: 587, secure: false });
  });

  it("rejects missing credentials without printing another secret", () => {
    vi.stubEnv("SMTP_PASSWORD", "");

    expect(() => getEmailServerEnv()).toThrow(ServerConfigurationError);
    try {
      getEmailServerEnv();
    } catch (error) {
      expect(String(error)).toContain("SMTP_PASSWORD");
      expect(String(error)).not.toContain(validEnv.EMAIL_WORKER_SECRET);
      expect(String(error)).not.toContain(validEnv.SMTP_PASSWORD);
    }
  });

  it("rejects an unapproved sender address", () => {
    vi.stubEnv("EMAIL_FROM_ADDRESS", "other@example.com");

    expect(() => getEmailServerEnv()).toThrow(/EMAIL_FROM_ADDRESS/);
  });
});

describe("email transport", () => {
  beforeEach(() => {
    createTransport.mockReset().mockReturnValue({ sendMail });
    sendMail.mockReset().mockResolvedValue({ messageId: "accepted" });
  });

  it("uses conservative pooled SMTP limits and timeouts", () => {
    const options = createEmailTransportOptions({
      host: "mail.regitech.co.uk",
      port: 465,
      secure: true,
      user: "info@regitech.co.uk",
      password: "private-test-password",
      fromName: "Regi Tech",
      fromAddress: "info@regitech.co.uk",
      replyTo: "info@regitech.co.uk",
      adminRecipient: "info@regitech.co.uk",
      workerSecret: "worker-secret-with-at-least-32-characters",
    });

    expect(options).toMatchObject({
      host: "mail.regitech.co.uk",
      port: 465,
      secure: true,
      pool: true,
      maxConnections: 2,
      maxMessages: 25,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
      auth: { user: "info@regitech.co.uk", pass: "private-test-password" },
      tls: { minVersion: "TLSv1.2" },
    });
  });

  it("classifies temporary SMTP and network failures for retry", () => {
    expect(classifyEmailError({ responseCode: 451, message: "Try later" })).toEqual({ permanent: false, safeMessage: "SMTP temporarily unavailable (451)." });
    expect(classifyEmailError({ code: "ETIMEDOUT", message: "private host details" })).toEqual({ permanent: false, safeMessage: "Email service connection failed." });
  });

  it("classifies SMTP 5xx failures as permanent", () => {
    expect(classifyEmailError({ responseCode: 550, message: "mailbox private details" })).toEqual({ permanent: true, safeMessage: "Email was rejected by the receiving server (550)." });
  });

  it("sends only the approved envelope fields", async () => {
    for (const [key, value] of Object.entries(validEnv)) vi.stubEnv(key, value);
    await sendEmailMessage({
      to: "alex@example.com",
      replyTo: "info@regitech.co.uk",
      subject: "Order confirmed",
      text: "Plain text",
      html: "<p>Plain text</p>",
      messageId: "<message@regitech.co.uk>",
    });

    expect(createTransport).toHaveBeenCalledTimes(1);
    expect(sendMail).toHaveBeenCalledWith({
      from: { name: "Regi Tech", address: "info@regitech.co.uk" },
      to: "alex@example.com",
      replyTo: "info@regitech.co.uk",
      subject: "Order confirmed",
      text: "Plain text",
      html: "<p>Plain text</p>",
      messageId: "<message@regitech.co.uk>",
    });
  });
});

export function getServerEnv() {
  return {
    idealPostcodesApiKey: process.env.IDEAL_POSTCODES_API_KEY?.trim() ?? "",
  };
}

export class ServerConfigurationError extends Error {
  constructor(public readonly missingVariables: string[]) {
    super(`Missing server configuration: ${missingVariables.join(", ")}`);
    this.name = "ServerConfigurationError";
  }
}

export type EmailServerEnv = {
  host: string;
  port: 465 | 587;
  secure: boolean;
  user: string;
  password: string;
  fromName: string;
  fromAddress: string;
  replyTo: string;
  adminRecipient: string;
  workerSecret: string;
};

function requireServerValues<T extends Record<string, string>>(values: T, variableNames: Record<keyof T, string>) {
  const missingVariables = (Object.keys(values) as Array<keyof T>)
    .filter((key) => !values[key])
    .map((key) => variableNames[key]);
  if (missingVariables.length) throw new ServerConfigurationError(missingVariables);
  return values;
}

export function getSupabaseServerEnv() {
  const values = {
    supabaseUrl: process.env.SUPABASE_URL?.trim() ?? "",
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY?.trim() ?? "",
  };
  return requireServerValues(values, {
    supabaseUrl: "SUPABASE_URL",
    supabaseSecretKey: "SUPABASE_SECRET_KEY",
  });
}

export function getSupabasePublicEnv() {
  const values = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "",
    supabasePublishableKey: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ?? "",
  };
  return requireServerValues(values, {
    supabaseUrl: "NEXT_PUBLIC_SUPABASE_URL",
    supabasePublishableKey: "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  });
}

export function getStripeServerEnv() {
  const values = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
  };
  return requireServerValues(values, {
    siteUrl: "NEXT_PUBLIC_SITE_URL",
    stripeSecretKey: "STRIPE_SECRET_KEY",
  });
}

export function getStripeWebhookEnv() {
  const stripe = getStripeServerEnv();
  const values = {
    ...stripe,
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
  };
  return requireServerValues(values, {
    siteUrl: "NEXT_PUBLIC_SITE_URL",
    stripeSecretKey: "STRIPE_SECRET_KEY",
    stripeWebhookSecret: "STRIPE_WEBHOOK_SECRET",
  });
}

export function getRoyalMailServerEnv() {
  const values = { apiKey: process.env.ROYAL_MAIL_CLICK_DROP_API_KEY?.trim() ?? "" };
  return requireServerValues(values, { apiKey: "ROYAL_MAIL_CLICK_DROP_API_KEY" });
}

export function getRateLimitEnv() {
  const values = { rateLimitHmacKey: process.env.RATE_LIMIT_HMAC_KEY?.trim() ?? "" };
  return requireServerValues(values, { rateLimitHmacKey: "RATE_LIMIT_HMAC_KEY" });
}

export function getEmailServerEnv(): EmailServerEnv {
  const raw = requireServerValues({
    host: process.env.SMTP_HOST?.trim() ?? "",
    port: process.env.SMTP_PORT?.trim() ?? "",
    secure: process.env.SMTP_SECURE?.trim().toLowerCase() ?? "",
    user: process.env.SMTP_USER?.trim().toLowerCase() ?? "",
    password: process.env.SMTP_PASSWORD ?? "",
    fromName: process.env.EMAIL_FROM_NAME?.trim() ?? "",
    fromAddress: process.env.EMAIL_FROM_ADDRESS?.trim().toLowerCase() ?? "",
    replyTo: process.env.EMAIL_REPLY_TO?.trim().toLowerCase() ?? "",
    adminRecipient: process.env.EMAIL_ADMIN_RECIPIENT?.trim().toLowerCase() ?? "",
    workerSecret: process.env.EMAIL_WORKER_SECRET ?? "",
  }, {
    host: "SMTP_HOST",
    port: "SMTP_PORT",
    secure: "SMTP_SECURE",
    user: "SMTP_USER",
    password: "SMTP_PASSWORD",
    fromName: "EMAIL_FROM_NAME",
    fromAddress: "EMAIL_FROM_ADDRESS",
    replyTo: "EMAIL_REPLY_TO",
    adminRecipient: "EMAIL_ADMIN_RECIPIENT",
    workerSecret: "EMAIL_WORKER_SECRET",
  });
  const port = Number(raw.port);
  const secure = raw.secure === "true";
  const approvedAddress = "info@regitech.co.uk";
  const invalid: string[] = [];
  if (raw.host !== "mail.regitech.co.uk") invalid.push("SMTP_HOST");
  if (!((port === 465 && secure) || (port === 587 && raw.secure === "false"))) invalid.push("SMTP_PORT", "SMTP_SECURE");
  if (raw.user !== approvedAddress) invalid.push("SMTP_USER");
  if (raw.fromName !== "Regi Tech") invalid.push("EMAIL_FROM_NAME");
  if (raw.fromAddress !== approvedAddress) invalid.push("EMAIL_FROM_ADDRESS");
  if (raw.replyTo !== approvedAddress) invalid.push("EMAIL_REPLY_TO");
  if (raw.adminRecipient !== approvedAddress) invalid.push("EMAIL_ADMIN_RECIPIENT");
  if (raw.workerSecret.length < 32) invalid.push("EMAIL_WORKER_SECRET");
  if (invalid.length) throw new ServerConfigurationError([...new Set(invalid)]);
  return {
    host: raw.host,
    port: port as 465 | 587,
    secure,
    user: raw.user,
    password: raw.password,
    fromName: raw.fromName,
    fromAddress: raw.fromAddress,
    replyTo: raw.replyTo,
    adminRecipient: raw.adminRecipient,
    workerSecret: raw.workerSecret,
  };
}

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

export function getRateLimitEnv() {
  const values = { rateLimitHmacKey: process.env.RATE_LIMIT_HMAC_KEY?.trim() ?? "" };
  return requireServerValues(values, { rateLimitHmacKey: "RATE_LIMIT_HMAC_KEY" });
}

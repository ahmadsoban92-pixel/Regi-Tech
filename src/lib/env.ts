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

export function getOrderServerEnv() {
  const values = {
    siteUrl: process.env.NEXT_PUBLIC_SITE_URL?.trim() ?? "",
    supabaseUrl: process.env.SUPABASE_URL?.trim() ?? "",
    supabaseSecretKey: process.env.SUPABASE_SECRET_KEY?.trim() ?? "",
    stripeSecretKey: process.env.STRIPE_SECRET_KEY?.trim() ?? "",
    stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "",
  };
  const missingVariables = [
    !values.siteUrl && "NEXT_PUBLIC_SITE_URL",
    !values.supabaseUrl && "SUPABASE_URL",
    !values.supabaseSecretKey && "SUPABASE_SECRET_KEY",
    !values.stripeSecretKey && "STRIPE_SECRET_KEY",
    !values.stripeWebhookSecret && "STRIPE_WEBHOOK_SECRET",
  ].filter((value): value is string => Boolean(value));
  if (missingVariables.length) throw new ServerConfigurationError(missingVariables);
  return values;
}

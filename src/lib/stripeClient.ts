import "server-only";
import Stripe from "stripe";
import { getStripeServerEnv } from "@/lib/env";

let client: Stripe | null = null;

export function getStripeClient(): Stripe {
  if (client) return client;
  client = new Stripe(getStripeServerEnv().stripeSecretKey);
  return client;
}
